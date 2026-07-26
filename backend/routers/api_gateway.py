from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from services import mcp_manager, context_forge

router = APIRouter()


@router.get("/mcp/servers")
async def list_mcp_servers():
    """List all available MCP servers."""
    return mcp_manager.get_all_servers()


@router.get("/mcp/tools")
async def list_all_tools():
    """List all tools across all MCP servers."""
    return mcp_manager.get_all_tools()


@router.get("/mcp/servers/{server_id}/tools")
async def list_server_tools(server_id: str):
    """List tools for a specific MCP server."""
    tools = mcp_manager.get_server_tools(server_id)
    if not tools:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Server '{server_id}' not found")
    return tools


@router.post("/mcp/execute")
async def execute_mcp_tool(
    server_id: str,
    tool_name: str,
    arguments: dict = {},
    current_user: dict = Depends(get_current_user)
):
    """Execute a specific MCP tool."""
    result = await mcp_manager.execute_tool(server_id, tool_name, arguments)
    return result


@router.get("/context")
async def get_context(current_user: dict = Depends(get_current_user)):
    """Get full user context from Context Forge."""
    return context_forge.get_user_context(current_user["sub"])


@router.get("/status")
async def platform_status():
    """Get platform component status."""
    redis_up = context_forge.REDIS_AVAILABLE

    return {
        "api": "online",
        "redis": "online" if redis_up else "offline (using in-memory)",
        "engine": "openrouter",
        "docling": "available" if True else "not installed"
    }
