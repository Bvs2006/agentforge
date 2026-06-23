from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SourceType(str, Enum):
    DOCUMENT = "document"
    REPOSITORY = "repository"
    WEBSITE = "website"
    SPREADSHEET = "spreadsheet"
    FOLDER = "folder"


class SourceStatus(str, Enum):
    PENDING = "pending"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    COMPLETED = "completed"
    FAILED = "failed"


class KnowledgeAgent(BaseModel):
    id: str = Field(default_factory=lambda: __import__("uuid").uuid4().hex)
    name: str
    description: str = ""
    source_ids: List[str] = []
    vector_collection: str = ""
    memory_enabled: bool = True
    created_by: str = ""
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class KnowledgeSource(BaseModel):
    id: str = Field(default_factory=lambda: __import__("uuid").uuid4().hex)
    agent_id: str = ""
    type: SourceType = SourceType.DOCUMENT
    name: str = ""
    path: Optional[str] = None
    url: Optional[str] = None
    status: SourceStatus = SourceStatus.PENDING
    progress: float = 0.0
    chunks_count: int = 0
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class IngestionResult(BaseModel):
    source_id: str
    agent_id: str
    collection_name: str
    status: str
    chunks_count: int = 0
    duration_ms: int = 0
    error: Optional[str] = None


class Chunk(BaseModel):
    id: str = ""
    content: str
    metadata: Dict[str, Any] = {}
    source_id: str = ""
    index: int = 0


class KnowledgeQuery(BaseModel):
    agent_id: str
    question: str
    top_k: int = 5
    memory_key: Optional[str] = None


class KnowledgeResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []
    chunks: List[Dict[str, Any]] = []
    agent_id: str = ""
    task_id: str = ""


class SourceCreate(BaseModel):
    type: SourceType
    name: str
    path: Optional[str] = None
    url: Optional[str] = None
    content: Optional[str] = None
    metadata: Dict[str, Any] = {}


class AgentCreate(BaseModel):
    name: str
    description: str = ""
    memory_enabled: bool = True
    sources: List[SourceCreate] = []


class ChatRequest(BaseModel):
    question: str
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []
    task_id: str = ""
