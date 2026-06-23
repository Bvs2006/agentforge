from typing import List, Optional, Dict, Any

from .vector_store import VectorStore
from .models import KnowledgeAgent


MAX_CONTEXT_LENGTH = 8000


class RetrievalService:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    def retrieve(
        self,
        agent: KnowledgeAgent,
        query: str,
        top_k: int = 5,
        filter_criteria: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not agent.vector_collection:
            return []
        results = self.vector_store.search(
            collection_name=agent.vector_collection,
            query=query,
            k=top_k,
            filter_criteria=filter_criteria,
        )
        return results

    def retrieve_with_scores(
        self,
        agent: KnowledgeAgent,
        query: str,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        results = self.retrieve(agent, query, top_k=top_k)
        return [r for r in results if r.get("score", 0) >= min_score]

    def format_context(self, results: List[Dict[str, Any]]) -> str:
        if not results:
            return ""
        parts = []
        for i, r in enumerate(results, 1):
            source_info = r.get("metadata", {}).get("source_type", "unknown")
            filename = r.get("metadata", {}).get("filename", "")
            source_str = f"[Source: {source_info}"
            if filename:
                source_str += f" - {filename}"
            source_str += "]"
            parts.append(f"{source_str}\n{r.get('content', '')}")
        context = "\n\n".join(parts)
        if len(context) > MAX_CONTEXT_LENGTH:
            context = context[:MAX_CONTEXT_LENGTH] + "\n\n[Context truncated due to length]"
        return context

    def search_across_agents(
        self,
        agents: List[KnowledgeAgent],
        query: str,
        top_k_per_agent: int = 3,
    ) -> Dict[str, List[Dict[str, Any]]]:
        results = {}
        for agent in agents:
            agent_results = self.retrieve(agent, query, top_k=top_k_per_agent)
            if agent_results:
                results[agent.id] = {
                    "agent_name": agent.name,
                    "results": agent_results,
                }
        return results

    def build_rag_prompt(
        self,
        question: str,
        context: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        sys_inst = system_instruction or (
            "You are a knowledgeable AI assistant. Answer the user's question "
            "based on the provided context. If the context doesn't contain "
            "enough information, say so clearly. Cite sources when possible."
        )
        prompt = f"{sys_inst}\n\n"
        if context:
            prompt += f"Context:\n{context}\n\n"
        prompt += f"Question: {question}\n\nAnswer:"
        return prompt
