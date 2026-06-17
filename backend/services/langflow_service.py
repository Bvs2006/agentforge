"""
Langflow Workflow Engine Service
Handles creating, running, and managing Langflow workflows.
Falls back to a simulated workflow execution when Langflow is not running.
"""
import httpx
import uuid
from typing import Optional
from utils.config import settings


async def _langflow_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{settings.langflow_url}/health")
            return r.status_code == 200
    except Exception:
        return False


async def run_flow(flow_id: str, task: str, tool_results: dict, context: dict) -> dict:
    if not await _langflow_available():
        return _simulate_flow_run(task, tool_results)

    payload = {
        "input_value": task,
        "input_type": "chat",
        "output_type": "chat",
        "tweaks": {
            "tool_results": tool_results,
            "context": context
        }
    }
    headers = {}
    if settings.langflow_api_key:
        headers["Authorization"] = f"Bearer {settings.langflow_api_key}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{settings.langflow_url}/api/v1/run/{flow_id}",
            json=payload,
            headers=headers
        )
        r.raise_for_status()
        data = r.json()
        return {
            "output": data.get("outputs", [{}])[0].get("outputs", [{}])[0].get("results", {}).get("message", {}).get("text", "Workflow completed."),
            "flow_id": flow_id,
            "source": "langflow"
        }


async def create_flow(name: str, agent_template: str) -> str:
    if not await _langflow_available():
        return f"mock_flow_{uuid.uuid4().hex[:8]}"

    flow_def = _build_flow_definition(name, agent_template)
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{settings.langflow_url}/api/v1/flows/",
            json=flow_def
        )
        if r.status_code in (200, 201):
            return r.json().get("id", str(uuid.uuid4()))
        return str(uuid.uuid4())


async def list_flows() -> list:
    if not await _langflow_available():
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{settings.langflow_url}/api/v1/flows/")
            return r.json() if r.status_code == 200 else []
    except Exception:
        return []


def _build_flow_definition(name: str, template: str) -> dict:
    """Build a Langflow JSON flow definition based on agent template."""
    return {
        "name": name,
        "description": f"AgentForge auto-generated flow for {template}",
        "data": {
            "nodes": [
                {
                    "id": "input_1",
                    "type": "ChatInput",
                    "data": {"template": {"input_value": {"value": ""}}},
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "llm_1",
                    "type": "OpenAIModel",
                    "data": {"template": {"model_name": {"value": "gpt-3.5-turbo"}}},
                    "position": {"x": 400, "y": 100}
                },
                {
                    "id": "output_1",
                    "type": "ChatOutput",
                    "data": {},
                    "position": {"x": 700, "y": 100}
                }
            ],
            "edges": [
                {"source": "input_1", "target": "llm_1", "id": "e1"},
                {"source": "llm_1", "target": "output_1", "id": "e2"}
            ]
        }
    }


def _simulate_flow_run(task: str, tool_results: dict) -> dict:
    """Simulated workflow execution for demo/dev mode."""
    steps_output = []

    if tool_results:
        for tool, result in tool_results.items():
            steps_output.append(f"✅ Tool '{tool}' executed: {str(result)[:100]}")

    default_steps = '  1. Analyzed task\n  2. Processed request\n  3. Generated response'
    steps_str = chr(10).join(f'  {i+1}. {s}' for i, s in enumerate(steps_output)) if steps_output else default_steps

    output = f"""**Workflow Execution Complete**

**Task:** {task}

**Steps Executed:**
{steps_str}

**Result:**
Task has been processed successfully. In production with Langflow connected, 
this would show the actual agent execution trace and output.

*Running in simulation mode — start Langflow on port 7860 for live execution.*
"""
    return {
        "output": output,
        "flow_id": f"sim_{uuid.uuid4().hex[:8]}",
        "source": "simulation"
    }
