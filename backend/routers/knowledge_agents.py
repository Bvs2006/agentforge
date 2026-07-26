from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from routers.auth import get_current_user
from services.knowledge_agents import knowledge_agent_service
from services.knowledge_agents.models import (
    AgentCreate, SourceCreate, ChatRequest, ChatResponse,
    KnowledgeAgent, KnowledgeSource, IngestionResult,
)
import os
import uuid
from typing import List, Optional, Dict, Any

router = APIRouter()


@router.post("/agents", response_model=KnowledgeAgent)
async def create_knowledge_agent(
    data: AgentCreate,
    current_user: dict = Depends(get_current_user),
):
    agent = await knowledge_agent_service.create_agent(current_user["sub"], data)
    return agent


@router.get("/agents", response_model=List[KnowledgeAgent])
async def list_knowledge_agents(current_user: dict = Depends(get_current_user)):
    return knowledge_agent_service.list_agents(user_id=current_user["sub"])


@router.get("/agents/{agent_id}", response_model=KnowledgeAgent)
async def get_knowledge_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
):
    agent = knowledge_agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Knowledge Agent not found")
    return agent


@router.delete("/agents/{agent_id}")
async def delete_knowledge_agent(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
):
    deleted = knowledge_agent_service.delete_agent(agent_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Knowledge Agent not found")
    return {"deleted": agent_id}


@router.get("/agents/{agent_id}/status")
async def get_agent_status(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
):
    agent = knowledge_agent_service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Knowledge Agent not found")
    return knowledge_agent_service.get_agent_status(agent_id)


@router.post("/agents/{agent_id}/sources", response_model=KnowledgeSource)
async def add_source(
    agent_id: str,
    source_data: SourceCreate,
    current_user: dict = Depends(get_current_user),
):
    source = knowledge_agent_service.add_source(agent_id, source_data)
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge Agent not found")
    return source


@router.get("/agents/{agent_id}/sources", response_model=List[KnowledgeSource])
async def list_sources(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
):
    return knowledge_agent_service.list_sources(agent_id)


@router.delete("/agents/{agent_id}/sources/{source_id}")
async def delete_source(
    agent_id: str,
    source_id: str,
    current_user: dict = Depends(get_current_user),
):
    deleted = knowledge_agent_service.delete_source(source_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Source not found")
    return {"deleted": source_id}


@router.post("/agents/{agent_id}/sources/{source_id}/ingest", response_model=IngestionResult)
async def ingest_source_endpoint(
    agent_id: str,
    source_id: str,
    current_user: dict = Depends(get_current_user),
):
    result = await knowledge_agent_service.ingest_source(agent_id, source_id)
    if result.status == "failed":
        raise HTTPException(status_code=400, detail=result.error or "Ingestion failed")
    return result


@router.post("/agents/{agent_id}/upload")
async def upload_source_file(
    agent_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    upload_dir = "/tmp/agentforge/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_name)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext in (".csv", ".xlsx", ".xls"):
        source_type = "spreadsheet"
    elif ext in (".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs"):
        source_type = "document"
    else:
        source_type = "document"

    source_data = SourceCreate(
        type=source_type,
        name=file.filename,
        path=file_path,
        metadata={"original_filename": file.filename, "content_type": file.content_type or ""},
    )
    source = knowledge_agent_service.add_source(agent_id, source_data)
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge Agent not found")
    result = await knowledge_agent_service.ingest_source(agent_id, source.id)
    return {"source": source, "ingestion": result}


@router.post("/agents/{agent_id}/chat", response_model=ChatResponse)
async def chat_with_agent(
    agent_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    response = await knowledge_agent_service.chat(agent_id, request)
    return response


@router.get("/agents/{agent_id}/search")
async def search_knowledge(
    agent_id: str,
    q: str = Query(..., description="Search query"),
    top_k: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
):
    results = knowledge_agent_service.search(agent_id, q, top_k=top_k)
    return {"query": q, "results": results, "count": len(results)}


@router.get("/status")
async def knowledge_platform_status():
    emb_available = knowledge_agent_service.embeddings.is_available()
    return {
        "embeddings": "available" if emb_available else "using mock",
        "vector_store": "chromadb configured",
        "ingestion": {
            "documents": True,
            "spreadsheets": True,
            "websites": True,
            "repositories": True,
        },
    }
