from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models.schemas import TaskRequest, AgentConfig, MCPToolCall
from routers.auth import get_current_user
from services import granite, langflow_service, mcp_manager, context_forge, docling_service
from services.granite import plan_agent_task_async
import uuid
from datetime import datetime
from typing import Optional

router = APIRouter()


@router.post("/run")
async def run_agent_task(request: TaskRequest, current_user: dict = Depends(get_current_user)):
    """Main orchestration: User task → Granite plan → Langflow workflow → MCP tools → Result"""
    user_id = current_user["sub"]
    task_id = str(uuid.uuid4())
    started_at = datetime.utcnow().isoformat()

    try:
        # Step 1: Store user message with agent_id if provided
        context_forge.store_conversation(user_id, "user", request.task, task_id, request.agent_id)

        # Step 2: Load user context
        ctx = context_forge.get_user_context(user_id)

        # Step 3: Check for specific agent config (or draft configuration) or use AI planner
        agent_config = None
        if request.context and "agent_config" in request.context:
            agent_config = request.context["agent_config"]
        elif request.agent_id:
            user_agents = context_forge.get_agent_configs(user_id)
            for name, cfg in user_agents.items():
                if cfg.get("id") == request.agent_id or name == request.agent_id:
                    agent_config = cfg
                    break

        if agent_config:
            template_id = agent_config.get("template_id", "general_agent")
            tools = agent_config.get("tools", [])
            plan = {
                "intent": f"Running agent '{agent_config['name']}' to handle task",
                "agent_template": template_id,
                "steps": [
                    f"Initiated session with Agent '{agent_config['name']}'",
                    "Loaded custom instructions & tools",
                    f"Executing with tools: {', '.join(tools) if tools else 'none'}",
                    "Synthesized response"
                ],
                "tools_needed": tools,
                "complexity": "medium",
                "estimated_time": "5-10 seconds",
                "source": "custom_agent"
            }
        else:
            plan = await plan_agent_task_async(request.task)

        # Step 4: Execute required MCP tools
        tool_results = {}
        for tool_name in plan.get("tools_needed", []):
            if "_mcp" in tool_name:
                server_tools = mcp_manager.get_server_tools(tool_name)
                if server_tools:
                    first_tool = server_tools[0]["name"]
                    result = await mcp_manager.execute_tool_mock(tool_name, first_tool, {})
                    tool_results[tool_name] = result

        # Step 5: Run Langflow workflow
        flow_id = await langflow_service.create_flow(request.task[:30], plan["agent_template"])
        workflow_result = await langflow_service.run_flow(
            flow_id, request.task, tool_results, ctx
        )

        completed_at = datetime.utcnow().isoformat()

        result = {
            "task_id": task_id,
            "status": "completed",
            "plan": plan,
            "tool_results": tool_results,
            "output": workflow_result["output"],
            "flow_id": workflow_result["flow_id"],
            "steps": [
                {"step": 1, "name": "Context Loaded", "status": "done"},
                {"step": 2, "name": "Planning & Context Setup", "status": "done", "detail": plan["intent"]},
                {"step": 3, "name": "MCP Tools Executed", "status": "done", "count": len(tool_results)},
                {"step": 4, "name": "Workflow Completed", "status": "done"},
            ],
            "created_at": started_at,
            "completed_at": completed_at,
            "source": plan.get("source", "unknown")
        }

        # Step 6: Store result and logs
        context_forge.store_task_result(task_id, result)
        context_forge.store_conversation(user_id, "assistant", workflow_result["output"], task_id, request.agent_id)

        return result

    except Exception as e:
        return {
            "task_id": task_id,
            "status": "error",
            "error": str(e),
            "created_at": started_at,
            "completed_at": datetime.utcnow().isoformat()
        }


@router.get("/templates")
async def get_templates():
    """Get all available agent templates."""
    return granite.get_templates()


@router.post("/agents")
async def create_agent(config: AgentConfig, current_user: dict = Depends(get_current_user)):
    """Save a new agent configuration."""
    user_id = current_user["sub"]
    agent_data = {
        "id": str(uuid.uuid4()),
        "name": config.name,
        "template_id": config.template_id,
        "description": config.description,
        "tools": config.tools,
        "parameters": config.parameters,
        "created_at": datetime.utcnow().isoformat()
    }
    context_forge.store_agent_config(user_id, agent_data)
    return agent_data


@router.get("/agents")
async def list_agents(current_user: dict = Depends(get_current_user)):
    """List all agents for the current user."""
    user_id = current_user["sub"]
    agents = context_forge.get_agent_configs(user_id)
    return list(agents.values())


@router.delete("/agents/{agent_name}")
async def delete_agent(agent_name: str, current_user: dict = Depends(get_current_user)):
    context_forge.delete_agent_config(current_user["sub"], agent_name)
    return {"deleted": agent_name}


@router.get("/history")
async def get_history(agent_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get conversation history for current user."""
    history = context_forge.get_conversation_history(current_user["sub"])
    if agent_id:
        return [m for m in history if m.get("agent_id") == agent_id]
    return history


@router.delete("/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    context_forge.clear_user_data(current_user["sub"])
    return {"cleared": True}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = context_forge.get_task_result(task_id)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


@router.post("/document")
async def process_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and process a document via IBM Docling."""
    content = await file.read()
    file_path = docling_service.save_upload(content, file.filename)
    result = docling_service.process_document(file_path, file.filename)
    return result
