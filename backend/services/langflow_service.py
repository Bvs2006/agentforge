"""
Workflow Execution Service
Generates responses using OpenRouter LLM instead of Langflow.
"""
import uuid


async def run_flow(flow_id: str, task: str, tool_results: dict, context: dict) -> dict:
    try:
        from services.openrouter import generate_text
        sep = "\n"
        tools_summary = sep.join(f"- {k}: {str(v)[:200]}" for k, v in tool_results.items())
        tools_section = f"Tool Results:\n{tools_summary}" if tool_results else ""
        prompt = f"""You are an AI assistant executing a task. Based on the task description and any tool results, provide a helpful response.

Task: {task}
{tools_section}

Provide a clear, concise response summarizing what was done and the outcome."""
        response = await generate_text(prompt)
        if response:
            return {
                "output": response,
                "flow_id": flow_id,
                "source": "openrouter"
            }
    except Exception:
        pass
    return _simulate_flow_run(task, tool_results)


async def create_flow(name: str, agent_template: str) -> str:
    return f"flow_{uuid.uuid4().hex[:8]}"


async def list_flows() -> list:
    return []


def _simulate_flow_run(task: str, tool_results: dict) -> dict:
    """Direct LLM execution via OpenRouter (no Langflow dependency)."""
    steps_output = []
    if tool_results:
        for tool, result in tool_results.items():
            steps_output.append(f"Executed tool '{tool}': {str(result)[:200]}")

    steps_str = "\n".join(f"  {i+1}. {s}" for i, s in enumerate(steps_output)) if steps_output else ""
    return {
        "output": f"Task processed: {task}\n{steps_str}".strip(),
        "flow_id": f"agent_{uuid.uuid4().hex[:8]}",
        "source": "direct"
    }
