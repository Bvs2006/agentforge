"""
MCP Manager Service
Manages connections to Model Context Protocol servers.
Provides tool discovery, execution, and management.
"""
import json
import asyncio
from typing import Optional

# MCP server registry
MCP_REGISTRY = {
    "github_mcp": {
        "name": "GitHub MCP",
        "description": "Manage GitHub repos, issues, PRs, and code",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env_required": ["GITHUB_PERSONAL_ACCESS_TOKEN"],
        "icon": "github",
        "tools": [
            {"name": "search_repositories", "description": "Search GitHub repositories"},
            {"name": "create_issue", "description": "Create a new GitHub issue"},
            {"name": "list_issues", "description": "List issues in a repository"},
            {"name": "create_pull_request", "description": "Create a pull request"},
            {"name": "get_file_contents", "description": "Get contents of a file from a repo"},
            {"name": "push_files", "description": "Push files to a GitHub repository"}
        ]
    },
    "filesystem_mcp": {
        "name": "File System MCP",
        "description": "Read, write, and manage local files",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp/agentforge"],
        "env_required": [],
        "icon": "folder",
        "tools": [
            {"name": "read_file", "description": "Read a file from disk"},
            {"name": "write_file", "description": "Write content to a file"},
            {"name": "list_directory", "description": "List files in a directory"},
            {"name": "create_directory", "description": "Create a new directory"},
            {"name": "delete_file", "description": "Delete a file"}
        ]
    },
    "gmail_mcp": {
        "name": "Gmail MCP",
        "description": "Read and send Gmail emails",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-gmail"],
        "env_required": ["GMAIL_CREDENTIALS"],
        "icon": "mail",
        "tools": [
            {"name": "list_emails", "description": "List recent emails from inbox"},
            {"name": "read_email", "description": "Read a specific email"},
            {"name": "send_email", "description": "Send an email"},
            {"name": "search_emails", "description": "Search emails by query"},
            {"name": "create_draft", "description": "Create an email draft"}
        ]
    },
    "google_sheets_mcp": {
        "name": "Google Sheets MCP",
        "description": "Read and write Google Sheets data",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-google-sheets"],
        "env_required": ["GOOGLE_CREDENTIALS"],
        "icon": "table",
        "tools": [
            {"name": "read_sheet", "description": "Read data from a sheet"},
            {"name": "write_sheet", "description": "Write data to a sheet"},
            {"name": "append_rows", "description": "Append rows to a sheet"},
            {"name": "create_sheet", "description": "Create a new sheet"}
        ]
    },
    "slack_mcp": {
        "name": "Slack MCP",
        "description": "Send messages and manage Slack channels",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-slack"],
        "env_required": ["SLACK_BOT_TOKEN"],
        "icon": "slack",
        "tools": [
            {"name": "post_message", "description": "Post a message to a channel"},
            {"name": "list_channels", "description": "List available channels"},
            {"name": "get_channel_history", "description": "Get message history from a channel"}
        ]
    },
    "notion_mcp": {
        "name": "Notion MCP",
        "description": "Read and write Notion pages and databases",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-notion"],
        "env_required": ["NOTION_API_KEY"],
        "icon": "notion",
        "tools": [
            {"name": "search_pages", "description": "Search Notion pages"},
            {"name": "create_page", "description": "Create a new Notion page"},
            {"name": "update_page", "description": "Update an existing page"},
            {"name": "query_database", "description": "Query a Notion database"}
        ]
    },
    "knowledge_agent_mcp": {
        "name": "Knowledge Agent MCP",
        "description": "Read, search, and query knowledge agents powered by vector databases",
        "command": "",
        "args": [],
        "env_required": [],
        "icon": "brain",
        "tools": [
            {"name": "read_document", "description": "Read and extract content from uploaded documents (PDF, DOCX, TXT, MD)"},
            {"name": "read_repository", "description": "Clone and extract content from a Git repository"},
            {"name": "read_spreadsheet", "description": "Read and parse spreadsheet files (CSV, Excel)"},
            {"name": "read_website", "description": "Scrape and extract content from a website or documentation site"},
            {"name": "semantic_search", "description": "Search knowledge base using semantic/vector similarity"},
            {"name": "retrieve_context", "description": "Retrieve relevant context from knowledge base for a query"},
            {"name": "list_sources", "description": "List all knowledge sources indexed for an agent"},
            {"name": "agent_status", "description": "Get the status and statistics of a knowledge agent"}
        ]
    }
}

# Active connections tracker
active_connections: dict = {}


def get_all_servers() -> list:
    return [
        {
            "id": k,
            "name": v["name"],
            "description": v["description"],
            "icon": v["icon"],
            "tools_count": len(v["tools"]),
            "env_required": v["env_required"],
            "connected": k in active_connections
        }
        for k, v in MCP_REGISTRY.items()
    ]


def get_server_tools(server_id: str) -> list:
    server = MCP_REGISTRY.get(server_id)
    if not server:
        return []
    return server["tools"]


def get_all_tools() -> list:
    all_tools = []
    for server_id, server in MCP_REGISTRY.items():
        for tool in server["tools"]:
            all_tools.append({
                "server": server_id,
                "server_name": server["name"],
                **tool
            })
    return all_tools


async def execute_tool_mock(server_id: str, tool_name: str, arguments: dict) -> dict:
    """
    Mock tool execution for demo purposes.
    Replace with real MCP client when running actual MCP servers.
    """
    await asyncio.sleep(0.3)  # Simulate network latency

    server = MCP_REGISTRY.get(server_id, {})
    tool_list = server.get("tools", [])
    tool = next((t for t in tool_list if t["name"] == tool_name), None)

    if not tool:
        return {"error": f"Tool '{tool_name}' not found in server '{server_id}'"}

    # Generate realistic mock responses per tool
    mock_responses = {
        "list_emails": {"emails": [
            {"id": "1", "subject": "Re: Project Update", "from": "team@example.com", "date": "2024-01-15"},
            {"id": "2", "subject": "Meeting Tomorrow", "from": "boss@example.com", "date": "2024-01-14"}
        ]},
        "send_email": {"status": "sent", "message_id": "msg_abc123"},
        "search_repositories": {"repositories": [
            {"name": "agentforge", "description": "No-code AI platform", "stars": 142},
            {"name": "fastmcp", "description": "Fast MCP server", "stars": 89}
        ]},
        "list_issues": {"issues": [
            {"number": 1, "title": "Add dark mode", "state": "open"},
            {"number": 2, "title": "Fix login bug", "state": "closed"}
        ]},
        "read_sheet": {"values": [["Name", "Score"], ["Alice", "95"], ["Bob", "87"]]},
        "list_channels": {"channels": [{"name": "general"}, {"name": "dev"}, {"name": "alerts"}]},
        "post_message": {"ok": True, "ts": "1705276800.000001"},
        "read_file": {"content": f"Mock file content for: {arguments.get('path', 'unknown')}"},
        "list_directory": {"files": ["report.pdf", "data.csv", "notes.txt"]},
        "search_pages": {"results": [{"title": "Project Roadmap", "id": "page_1"}]},
        "create_issue": {"number": 42, "url": "https://github.com/org/repo/issues/42"},
        "read_document": {"status": "success", "text": "Document content extracted successfully.", "pages": 5, "format": "pdf"},
        "read_repository": {"status": "success", "files_processed": 42, "repo": "sample-repo", "total_chars": 150000},
        "read_spreadsheet": {"status": "success", "sheets": 3, "total_rows": 150, "columns": ["Name", "Value", "Date"]},
        "read_website": {"status": "success", "pages_crawled": 8, "total_words": 24000, "root_url": "https://example.com"},
        "semantic_search": {"status": "success", "results": [
            {"content": "Relevant document chunk...", "score": 0.92, "source": "document.pdf"},
            {"content": "Another relevant section...", "score": 0.87, "source": "readme.md"}
        ]},
        "retrieve_context": {"status": "success", "context": "Extracted context from knowledge base...", "chunks_used": 5},
        "list_sources": {"sources": [
            {"id": "src_1", "name": "document.pdf", "type": "document", "status": "completed", "chunks": 25},
            {"id": "src_2", "name": "https://docs.example.com", "type": "website", "status": "completed", "chunks": 180}
        ]},
        "agent_status": {"status": "ready", "sources": 3, "total_chunks": 450, "memory_enabled": True, "created_at": "2024-06-01T00:00:00Z"},
    }

    return mock_responses.get(tool_name, {
        "status": "success",
        "tool": tool_name,
        "server": server_id,
        "arguments": arguments,
        "result": f"Mock result for {tool_name}"
    })


async def execute_tool(server_id: str, tool_name: str, arguments: dict) -> dict:
    """
    Execute an MCP tool. Uses real MCP client if available, otherwise mock.
    """
    try:
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client

        server_config = MCP_REGISTRY.get(server_id)
        if not server_config:
            return {"error": f"Unknown server: {server_id}"}

        server_params = StdioServerParameters(
            command=server_config["command"],
            args=server_config["args"]
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=arguments)
                return {"result": str(result.content), "source": "real_mcp"}

    except Exception as e:
        print(f"[MCP] Real execution failed ({e}), using mock")
        return await execute_tool_mock(server_id, tool_name, arguments)
