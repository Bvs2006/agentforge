from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models.schemas import TaskRequest, AgentConfig, MCPToolCall
from routers.auth import get_current_user
from services import granite, langflow_service, mcp_manager, context_forge, docling_service
import uuid
from datetime import datetime

router = APIRouter()


@router.post("/run")
async def run_agent_task(request: TaskRequest, current_user: dict = Depends(get_current_user)):
    """Main orchestration: User task → Granite plan → Langflow workflow → MCP tools → Result"""
    user_id = current_user["sub"]
    task_id = str(uuid.uuid4())
    started_at = datetime.utcnow().isoformat()

    try:
        # Step 1: Store user message
        context_forge.store_conversation(user_id, "user", request.task, task_id)

        # Step 2: Load user context
        ctx = context_forge.get_user_context(user_id)

        # Step 3: IBM Granite plans the task
        plan = granite.plan_agent_task(request.task)

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
                {"step": 2, "name": "Granite Planning", "status": "done", "detail": plan["intent"]},
                {"step": 3, "name": "MCP Tools Executed", "status": "done", "count": len(tool_results)},
                {"step": 4, "name": "Workflow Completed", "status": "done"},
            ],
            "created_at": started_at,
            "completed_at": completed_at,
            "source": plan.get("source", "unknown")
        }

        # Step 6: Store result
        context_forge.store_task_result(task_id, result)
        context_forge.store_conversation(user_id, "assistant", workflow_result["output"], task_id)

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
async def get_history(current_user: dict = Depends(get_current_user)):
    """Get conversation history for current user."""
    return context_forge.get_conversation_history(current_user["sub"])


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
