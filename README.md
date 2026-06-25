# AgentForge

AgentForge is a no-code AI automation workspace for building, saving, and running task-specific agents. It combines a React builder UI with a FastAPI backend, IBM Granite planning, Langflow-style workflow execution, Docling document processing, Context Forge memory, and Model Context Protocol (MCP) tools.

## What It Does

- Build agents from built-in templates such as Email, GitHub, Documents, Sheets, Research, and General Automation.
- Create custom agents by selecting MCP tools and defining the agent goal, max steps, and response verbosity.
- Browse MCP servers, inspect required environment variables, and test individual tools.
- Draft new MCP registry entries from the UI before adding them to the backend.
- Run agent workflows through a guided six-step execution flow.
- Store saved agents, task history, and user context.
- Run in development with mock planners and mock MCP execution when external services are not configured.

### Knowledge Agents

Knowledge Agents extend the platform with a full RAG (Retrieval-Augmented Generation) pipeline. They ingest data from **documents, spreadsheets, websites, git repositories, and local folders**, chunk and embed the content into **ChromaDB**, and answer natural language questions based on the retrieved knowledge.

The answering pipeline tries **OpenRouter** (configurable model) first, falls back to **IBM Granite**, then to direct context extraction.

### OpenRouter Integration

AgentForge integrates with [OpenRouter.ai](https://openrouter.ai) to provide access to a wide variety of LLMs through a unified API. The default free model is `gryphe/mythomax-l2-13b`, configurable via the `OPENROUTER_MODEL` environment variable.

## Architecture

```text
React UI
  -> FastAPI backend
    -> IBM Granite planner
    -> Langflow workflow service
    -> MCP manager
    -> IBM Docling document service
    -> Context Forge / Redis memory
```

The project is split into:

- `frontend/`: Vite, React, Tailwind CSS, Zustand, React Router.
- `backend/`: FastAPI routers, Pydantic schemas, service adapters, auth utilities.
- `docker-compose.yml`: local multi-service startup.

## Quick Start With Docker

```bash
cd agentforge
docker-compose up --build
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Langflow, when enabled: `http://localhost:7860`

## Manual Development Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On macOS or Linux, activate the environment with:

```bash
source venv/bin/activate
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:3000` by default.

## Configuration

Create `backend/.env` for real service credentials. In dev mode, AgentForge can run with fallbacks for planning, MCP execution, and memory.

Common environment variables:

```env
IBM_API_KEY=your_key_here
IBM_PROJECT_ID=your_project_id
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
SECRET_KEY=change_me
REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=gryphe/mythomax-l2-13b
```

MCP integrations can require their own credentials:

| MCP server | Environment variable |
| --- | --- |
| GitHub | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| Gmail | `GMAIL_CREDENTIALS` |
| Google Sheets | `GOOGLE_CREDENTIALS` |
| Slack | `SLACK_BOT_TOKEN` |
| Notion | `NOTION_API_KEY` |

## Agent Building Workflow

1. Open **Agent Builder**.
2. Select a built-in agent template or choose **Create New Agent**.
3. Define the goal, choose MCP tools, and set execution options.
4. Save the agent.
5. Open **Run Task** to execute an agent workflow.

Saved agents are stored through the backend agent API and appear in the Agent Builder page.

## MCP Workflow

1. Open **MCP Workspace**.
2. Expand a built-in MCP server to inspect tools and required environment variables.
3. Test individual MCP tools from the UI.
4. Use **Create Custom MCP** to draft a backend registry entry for a new connector.
5. Add the generated draft to `backend/services/mcp_manager.py` when you are ready to make it available to agents.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Dashboard and platform status |
| `/agents` | Built-in agent templates, custom builder, saved agents |
| `/run` | Guided workflow runner |
| `/mcp` | MCP server browser, tool testing, custom MCP drafts |
| `/history` | Conversation and task history |
| `/settings` | User and platform settings |

## API Overview

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user |
| `POST` | `/auth/login` | Get an auth token |
| `GET` | `/agent/templates` | List built-in agent templates |
| `POST` | `/agent/agents` | Save an agent |
| `GET` | `/agent/agents` | List saved agents |
| `POST` | `/agent/run` | Run an agent task |
| `GET` | `/api/v1/mcp/servers` | List MCP servers |
| `GET` | `/api/v1/mcp/servers/{id}/tools` | List tools for a server |
| `POST` | `/api/v1/mcp/execute` | Execute an MCP tool |
| `GET` | `/api/v1/status` | Check platform status |
| `POST` | `/knowledge/agents` | Create a Knowledge Agent |
| `GET` | `/knowledge/agents` | List Knowledge Agents |
| `POST` | `/knowledge/agents/{id}/chat` | Ask a question via RAG |
| `POST` | `/knowledge/agents/{id}/upload` | Upload a file for ingestion |
| `GET` | `/knowledge/agents/{id}/search` | Raw vector search |

## Project Structure

```text
agentforge/
  backend/
    main.py
    routers/
      auth.py
      api_gateway.py
      agent_service.py
      knowledge_agents.py
    services/
      granite.py
      langflow_service.py
      mcp_manager.py
      docling_service.py
      context_forge.py
      openrouter.py
      knowledge_agents/
        knowledge_agent_service.py
        document_ingestion.py
        spreadsheet_ingestion.py
        web_ingestion.py
        repository_ingestion.py
        chunking.py
        embeddings.py
        vector_store.py
        retrieval.py
        security.py
    models/
      schemas.py
    utils/
      auth_utils.py
      config.py
  frontend/
    src/
      App.jsx
      components/
      hooks/
      pages/
      services/
    package.json
    vite.config.js
    tailwind.config.js
  docker-compose.yml
  README.md
```

## Development Notes

- The backend uses mock planning when IBM watsonx credentials are not configured.
- MCP execution falls back to mock responses if real MCP client execution fails.
- Redis is optional; memory falls back to an in-process store.
- The frontend API base URL is currently `http://localhost:8000` in `frontend/src/services/api.js`.

## License

MIT
