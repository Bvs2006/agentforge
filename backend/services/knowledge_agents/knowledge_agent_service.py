import uuid
import time
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime

from .models import (
    KnowledgeAgent, KnowledgeSource, IngestionResult,
    SourceType, SourceStatus, Chunk,
    AgentCreate, SourceCreate, ChatRequest, ChatResponse,
)
from .document_ingestion import DocumentIngestion
from .spreadsheet_ingestion import SpreadsheetIngestion
from .web_ingestion import WebIngestion
from .repository_ingestion import RepositoryIngestion
from .chunking import ChunkingService, ChunkStrategy
from .embeddings import EmbeddingService
from .vector_store import VectorStore
from .retrieval import RetrievalService
from .security import RateLimiter


KB_AGENTS_PREFIX = "kb_agents"
KB_SOURCES_PREFIX = "kb_sources"


class KnowledgeAgentService:
    def __init__(self):
        self.document_ingestion = DocumentIngestion()
        self.spreadsheet_ingestion = SpreadsheetIngestion()
        self.web_ingestion = WebIngestion()
        self.repository_ingestion = RepositoryIngestion()
        self.chunking = ChunkingService()
        self.embeddings = EmbeddingService()
        self.vector_store = VectorStore()
        self.retrieval = RetrievalService(self.vector_store)
        self.rate_limiter = RateLimiter(max_calls=100, window_seconds=60)
        self._agents_store: Dict[str, KnowledgeAgent] = {}
        self._sources_store: Dict[str, KnowledgeSource] = {}
        self._storage_backend = None

    def _init_storage(self):
        if self._storage_backend is not None:
            return
        try:
            from services.context_forge import _get_redis, REDIS_AVAILABLE
            if REDIS_AVAILABLE:
                self._storage_backend = "redis"
            else:
                self._storage_backend = "memory"
        except Exception:
            self._storage_backend = "memory"

    async def create_agent(self, user_id: str, data: AgentCreate) -> KnowledgeAgent:
        self._init_storage()
        collection_name = f"agent_{uuid.uuid4().hex[:12]}"
        agent = KnowledgeAgent(
            name=data.name,
            description=data.description,
            vector_collection=collection_name,
            memory_enabled=data.memory_enabled,
            created_by=user_id,
        )
        self.vector_store.create_collection(collection_name)
        self._agents_store[agent.id] = agent
        if data.sources:
            for src_data in data.sources:
                source = self.add_source(agent.id, src_data)
                if source:
                    await self.ingest_source(agent.id, source.id)
        return agent

    def get_agent(self, agent_id: str) -> Optional[KnowledgeAgent]:
        return self._agents_store.get(agent_id)

    def list_agents(self, user_id: Optional[str] = None) -> List[KnowledgeAgent]:
        agents = list(self._agents_store.values())
        if user_id:
            agents = [a for a in agents if a.created_by == user_id]
        return agents

    def delete_agent(self, agent_id: str) -> bool:
        agent = self._agents_store.pop(agent_id, None)
        if agent:
            self.vector_store.delete_collection(agent.vector_collection)
            to_delete = [sid for sid, s in self._sources_store.items() if s.agent_id == agent_id]
            for sid in to_delete:
                self._sources_store.pop(sid, None)
            return True
        return False

    def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Optional[KnowledgeAgent]:
        agent = self._agents_store.get(agent_id)
        if not agent:
            return None
        for key, value in updates.items():
            if hasattr(agent, key) and key not in ("id", "created_by", "created_at"):
                setattr(agent, key, value)
        agent.updated_at = datetime.utcnow().isoformat()
        self._agents_store[agent_id] = agent
        return agent

    def add_source(self, agent_id: str, source_data: SourceCreate) -> Optional[KnowledgeSource]:
        agent = self._agents_store.get(agent_id)
        if not agent:
            return None
        source = KnowledgeSource(
            agent_id=agent_id,
            type=source_data.type,
            name=source_data.name,
            path=source_data.path,
            url=source_data.url,
            metadata=source_data.metadata,
        )
        self._sources_store[source.id] = source
        agent.source_ids.append(source.id)
        agent.updated_at = datetime.utcnow().isoformat()
        return source

    def get_source(self, source_id: str) -> Optional[KnowledgeSource]:
        return self._sources_store.get(source_id)

    def list_sources(self, agent_id: str) -> List[KnowledgeSource]:
        return [s for s in self._sources_store.values() if s.agent_id == agent_id]

    def delete_source(self, source_id: str) -> bool:
        source = self._sources_store.pop(source_id, None)
        if source:
            agent = self._agents_store.get(source.agent_id)
            if agent:
                agent.source_ids = [s for s in agent.source_ids if s != source_id]
                self.vector_store.delete_documents(agent.vector_collection, source_id=source_id)
            return True
        return False

    async def ingest_source(self, agent_id: str, source_id: str) -> IngestionResult:
        agent = self._agents_store.get(agent_id)
        source = self._sources_store.get(source_id)
        if not agent or not source:
            return IngestionResult(
                source_id=source_id, agent_id=agent_id,
                collection_name="", status="failed",
                error="Agent or source not found",
            )
        start_time = time.time()
        try:
            source.status = SourceStatus.EXTRACTING
            source.progress = 10.0
            if source.type == SourceType.DOCUMENT:
                if not source.path:
                    raise ValueError("Document source requires a file path")
                result = self.document_ingestion.ingest(source.path, source)
            elif source.type == SourceType.SPREADSHEET:
                if not source.path:
                    raise ValueError("Spreadsheet source requires a file path")
                result = self.spreadsheet_ingestion.ingest(source.path, source)
            elif source.type == SourceType.WEBSITE:
                if source.url:
                    result = await self.web_ingestion.ingest(source.url, source=source)
                else:
                    raise ValueError("Website source requires a URL")
            elif source.type == SourceType.REPOSITORY:
                if source.url:
                    result = await self.repository_ingestion.ingest(source.url, source=source)
                elif source.path:
                    result = self.repository_ingestion.ingest_local(source.path, source)
                else:
                    raise ValueError("Repository source requires URL or path")
            elif source.type == SourceType.FOLDER:
                if not source.path:
                    raise ValueError("Folder source requires a path")
                result = self.repository_ingestion.ingest_local(source.path, source)
            else:
                raise ValueError(f"Unsupported source type: {source.type}")

            source.status = SourceStatus.CHUNKING
            source.progress = 40.0
            text = result.get("text", "")
            source_meta = result.get("metadata", {})
            strategy = ChunkStrategy.DOCUMENT_AWARE if source.type in (SourceType.WEBSITE, SourceType.REPOSITORY) else ChunkStrategy.RECURSIVE
            chunks = self.chunking.chunk(
                text=text,
                strategy=strategy,
                chunk_size=500,
                overlap=50,
                metadata=source_meta,
                source_id=source.id,
            )
            source.status = SourceStatus.EMBEDDING
            source.progress = 70.0
            added = self.vector_store.add_documents(agent.vector_collection, chunks)
            source.chunks_count = added
            source.progress = 100.0
            source.status = SourceStatus.COMPLETED
            duration = int((time.time() - start_time) * 1000)
            return IngestionResult(
                source_id=source.id,
                agent_id=agent_id,
                collection_name=agent.vector_collection,
                status="completed",
                chunks_count=added,
                duration_ms=duration,
            )
        except Exception as e:
            source.status = SourceStatus.FAILED
            source.error = str(e)
            duration = int((time.time() - start_time) * 1000)
            return IngestionResult(
                source_id=source.id,
                agent_id=agent_id,
                collection_name=agent.vector_collection,
                status="failed",
                error=str(e),
                duration_ms=duration,
            )

    def chat(self, agent_id: str, request: ChatRequest) -> ChatResponse:
        agent = self._agents_store.get(agent_id)
        if not agent:
            return ChatResponse(answer="Agent not found", task_id="")
        task_id = uuid.uuid4().hex
        if not self.rate_limiter.check(f"chat_{agent_id}"):
            return ChatResponse(answer="Rate limit exceeded. Please wait before sending more requests.", task_id=task_id)
        results = self.retrieval.retrieve(agent, request.question, top_k=request.top_k)
        context = self.retrieval.format_context(results)
        prompt = self.retrieval.build_rag_prompt(request.question, context)
        answer = self._generate_answer(prompt)
        sources = [
            {
                "content": r.get("content", "")[:200],
                "score": r.get("score", 0),
                "source_type": r.get("metadata", {}).get("source_type", "unknown"),
                "filename": r.get("metadata", {}).get("filename", ""),
            }
            for r in results[:3]
        ]
        return ChatResponse(answer=answer, sources=sources, task_id=task_id)

    def _generate_answer(self, prompt: str) -> str:
        try:
            from services.granite import _get_model
            model = _get_model()
            if model:
                response = model.generate_text(prompt)
                if response and not response.startswith("ERROR:") and "error" not in response.lower()[:100]:
                    return response
        except Exception:
            pass

        context_start = prompt.find("Context:\n")
        question_start = prompt.rfind("Question: ")
        if context_start >= 0 and question_start >= 0:
            context = prompt[context_start + 9:question_start].strip()
            lines = [l.strip() for l in context.split("\n") if l.strip()]
            content_lines = [l for l in lines if l and not l.startswith("[Source:")]
            if content_lines:
                return content_lines[0] if len(content_lines) <= 3 else "\n".join(content_lines[:5]) + "\n\n(Based on retrieved knowledge from your sources.)"

        return "I searched your knowledge base but couldn't generate a complete answer. Please try rephrasing your question or add more sources."

    def search(self, agent_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        agent = self._agents_store.get(agent_id)
        if not agent:
            return []
        return self.retrieval.retrieve(agent, query, top_k=top_k)

    def get_agent_status(self, agent_id: str) -> Dict[str, Any]:
        agent = self._agents_store.get(agent_id)
        if not agent:
            return {"status": "not_found"}
        sources = self.list_sources(agent_id)
        collection_info = self.vector_store.get_collection_info(agent.vector_collection) if agent.vector_collection else None
        return {
            "agent_id": agent.id,
            "name": agent.name,
            "status": "ready" if all(s.status == SourceStatus.COMPLETED for s in sources) else "processing",
            "sources_count": len(sources),
            "sources_completed": sum(1 for s in sources if s.status == SourceStatus.COMPLETED),
            "sources_failed": sum(1 for s in sources if s.status == SourceStatus.FAILED),
            "total_chunks": collection_info.get("count", 0) if collection_info else 0,
            "memory_enabled": agent.memory_enabled,
            "created_at": agent.created_at,
        }
