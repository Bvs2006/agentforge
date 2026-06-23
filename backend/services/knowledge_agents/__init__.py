from .knowledge_agent_service import KnowledgeAgentService
from .models import KnowledgeAgent, KnowledgeSource, IngestionResult

knowledge_agent_service = KnowledgeAgentService()

__all__ = [
    "knowledge_agent_service",
    "KnowledgeAgent",
    "KnowledgeSource",
    "IngestionResult",
]
