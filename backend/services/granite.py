"""
IBM Granite AI Reasoning & Planning Service
Handles intent understanding, agent template matching, and task decomposition.
Falls back to a mock planner when IBM credentials are not configured.
"""
import json
import re
from typing import Optional
from utils.config import settings

# Try to import IBM watsonx SDK
try:
    from ibm_watsonx_ai import APIClient, Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference
    IBM_AVAILABLE = True
except ImportError:
    IBM_AVAILABLE = False


AGENT_TEMPLATES = {
    "email_agent": {
        "name": "Email Agent",
        "description": "Read, compose, and send emails via Gmail",
        "tools": ["gmail_mcp"],
        "category": "communication"
    },
    "github_agent": {
        "name": "GitHub Agent",
        "description": "Manage repos, issues, PRs, and code",
        "tools": ["github_mcp"],
        "category": "development"
    },
    "document_agent": {
        "name": "Document Agent",
        "description": "Process, analyze, and summarize documents",
        "tools": ["filesystem_mcp"],
        "category": "productivity"
    },
    "sheets_agent": {
        "name": "Sheets Agent",
        "description": "Read and write Google Sheets data",
        "tools": ["google_sheets_mcp"],
        "category": "data"
    },
    "research_agent": {
        "name": "Research Agent",
        "description": "Search, research, and compile information",
        "tools": ["filesystem_mcp"],
        "category": "research"
    },
    "general_agent": {
        "name": "General Agent",
        "description": "Handle general automation tasks",
        "tools": [],
        "category": "general"
    }
}

PLANNING_PROMPT = """You are an AI agent planner for AgentForge, a no-code automation platform.
Given a user task, analyze it and respond ONLY with a valid JSON object (no markdown, no explanation).

JSON format:
{{
  "intent": "brief description of what user wants",
  "agent_template": "one of: email_agent, github_agent, document_agent, sheets_agent, research_agent, general_agent",
  "steps": ["step1", "step2", "step3"],
  "tools_needed": ["tool1", "tool2"],
  "complexity": "low|medium|high",
  "estimated_time": "e.g. 30 seconds"
}}

User task: {task}
"""


def _get_model() -> Optional[object]:
    if not IBM_AVAILABLE:
        return None
    if settings.ibm_api_key == "demo_key":
        return None
    try:
        credentials = Credentials(url=settings.ibm_watsonx_url, api_key=settings.ibm_api_key)
        return ModelInference(
            model_id="ibm/granite-13b-instruct-v2",
            credentials=credentials,
            project_id=settings.ibm_project_id,
            params={"max_new_tokens": 512, "temperature": 0.2}
        )
    except Exception as e:
        print(f"[Granite] Could not connect to IBM watsonx: {e}")
        return None


def _mock_plan(task: str) -> dict:
    """Fallback planner when IBM credentials are not set."""
    task_lower = task.lower()

    if any(w in task_lower for w in ["email", "gmail", "send", "inbox", "mail"]):
        template = "email_agent"
        tools = ["gmail_mcp"]
    elif any(w in task_lower for w in ["github", "repo", "issue", "pull request", "pr", "commit", "code"]):
        template = "github_agent"
        tools = ["github_mcp"]
    elif any(w in task_lower for w in ["sheet", "spreadsheet", "excel", "csv", "table"]):
        template = "sheets_agent"
        tools = ["google_sheets_mcp"]
    elif any(w in task_lower for w in ["document", "pdf", "file", "read", "analyze", "summarize"]):
        template = "document_agent"
        tools = ["filesystem_mcp"]
    elif any(w in task_lower for w in ["research", "search", "find", "look up", "info"]):
        template = "research_agent"
        tools = ["filesystem_mcp"]
    else:
        template = "general_agent"
        tools = []

    steps = [
        f"Understand the request: '{task[:60]}...' " if len(task) > 60 else f"Understand: '{task}'",
        "Load relevant context from memory",
        f"Execute using {AGENT_TEMPLATES[template]['name']}",
        "Process and format results",
        "Return structured output"
    ]

    return {
        "intent": f"User wants to: {task[:100]}",
        "agent_template": template,
        "steps": steps,
        "tools_needed": tools,
        "complexity": "medium",
        "estimated_time": "15-30 seconds",
        "source": "mock_planner"
    }


async def plan_agent_task_async(task: str) -> dict:
    """Plan a task using OpenRouter, then IBM Granite, then mock."""
    try:
        from services.openrouter import generate_text
        prompt = PLANNING_PROMPT.format(task=task)
        response = await generate_text(prompt)
        if response:
            clean = re.sub(r"```json|```", "", response).strip()
            plan = json.loads(clean)
            plan["source"] = "openrouter"
            return plan
    except Exception as e:
        print(f"[OpenRouter] Planning error: {e}")

    model = _get_model()
    if model:
        try:
            prompt = PLANNING_PROMPT.format(task=task)
            response = model.generate_text(prompt=prompt)
            clean = re.sub(r"```json|```", "", response).strip()
            plan = json.loads(clean)
            plan["source"] = "ibm_granite"
            return plan
        except Exception as e:
            print(f"[Granite] Generation error: {e}")

    return _mock_plan(task)


def plan_agent_task(task: str) -> dict:
    """Synchronous wrapper for backward compatibility."""
    import asyncio
    return asyncio.run(plan_agent_task_async(task))


def get_templates() -> list:
    return [
        {
            "id": k,
            "name": v["name"],
            "description": v["description"],
            "tools": v["tools"],
            "category": v["category"],
            "icon": _get_icon(v["category"])
        }
        for k, v in AGENT_TEMPLATES.items()
    ]


def _get_icon(category: str) -> str:
    icons = {
        "communication": "📧",
        "development": "💻",
        "productivity": "📄",
        "data": "📊",
        "research": "🔍",
        "general": "🤖"
    }
    return icons.get(category, "🤖")
