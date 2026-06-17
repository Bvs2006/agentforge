from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth ---
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: str
    username: str
    email: str

# --- Agent ---
class AgentTemplate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    icon: str
    tools: List[str]
    config_schema: Dict[str, Any]

class AgentConfig(BaseModel):
    template_id: str
    name: str
    description: Optional[str] = ""
    tools: List[str] = []
    parameters: Dict[str, Any] = {}

class TaskRequest(BaseModel):
    task: str
    agent_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}

class TaskResult(BaseModel):
    task_id: str
    status: str
    result: Optional[Any] = None
    steps: List[Dict[str, Any]] = []
    created_at: str
    completed_at: Optional[str] = None

# --- MCP ---
class MCPTool(BaseModel):
    name: str
    description: str
    server: str
    input_schema: Dict[str, Any] = {}

class MCPToolCall(BaseModel):
    server: str
    tool: str
    arguments: Dict[str, Any] = {}

# --- Document ---
class DocumentUpload(BaseModel):
    filename: str
    content_type: str

class DocumentResult(BaseModel):
    doc_id: str
    filename: str
    text: str
    chunks: List[str]
    metadata: Dict[str, Any]

# --- Workflow ---
class WorkflowStep(BaseModel):
    id: str
    type: str
    label: str
    config: Dict[str, Any] = {}
    position: Dict[str, float] = {"x": 0, "y": 0}

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str

class Workflow(BaseModel):
    id: Optional[str] = None
    name: str
    steps: List[WorkflowStep]
    edges: List[WorkflowEdge]
