import os
import time
from typing import List, Optional, Dict, Any
from datetime import datetime

from .models import Chunk
from .embeddings import EmbeddingService


CHROMA_PERSIST_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "..", "data", "chroma"
)


class VectorStore:
    def __init__(self, persist_directory: str = CHROMA_PERSIST_DIR):
        self.persist_dir = persist_directory
        self._client = None
        self._initialized = False
        self._init_error: Optional[str] = None
        self.embeddings = EmbeddingService()
        self._in_memory: Dict[str, Dict[str, Any]] = {}

    def _init(self):
        if self._initialized:
            return
        try:
            import chromadb
            from chromadb.config import Settings
            os.makedirs(self.persist_dir, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=self.persist_dir,
                settings=Settings(anonymized_telemetry=False),
            )
            self._initialized = True
        except ImportError:
            self._init_error = "chromadb not installed, using in-memory fallback"
            self._initialized = True
        except Exception as e:
            self._init_error = str(e)
            self._initialized = True

    def create_collection(self, name: str) -> str:
        self._init()
        if self._client is not None:
            try:
                self._client.create_collection(
                    name=name,
                    metadata={"created_at": datetime.utcnow().isoformat()},
                )
            except Exception:
                pass
        if name not in self._in_memory:
            self._in_memory[name] = {"documents": [], "metadatas": [], "ids": []}
        return name

    def add_documents(
        self,
        collection_name: str,
        chunks: List[Chunk],
    ) -> int:
        if not chunks:
            return 0
        self._init()
        texts = [c.content for c in chunks]
        metadatas = [c.metadata for c in chunks]
        ids = [c.id for c in chunks]

        if self._client is not None:
            try:
                collection = self._client.get_collection(collection_name)
                embeddings = self.embeddings.embed_batch(texts)
                collection.add(
                    documents=texts,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids,
                )
                return len(chunks)
            except Exception:
                pass

        emb_list = self.embeddings.embed_batch(texts)
        col = self._in_memory.setdefault(collection_name, {"documents": [], "metadatas": [], "ids": [], "embeddings": []})
        col["documents"].extend(texts)
        col["metadatas"].extend(metadatas)
        col["ids"].extend(ids)
        col.setdefault("embeddings", []).extend(emb_list)
        return len(chunks)

    def search(
        self,
        collection_name: str,
        query: str,
        k: int = 5,
        filter_criteria: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        self._init()
        query_embedding = self.embeddings.embed(query)
        if self._client is not None:
            try:
                collection = self._client.get_collection(collection_name)
                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=k,
                    where=filter_criteria,
                )
                formatted = []
                if results["ids"]:
                    for i in range(len(results["ids"][0])):
                        formatted.append({
                            "id": results["ids"][0][i],
                            "content": results["documents"][0][i] if results.get("documents") else "",
                            "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                            "score": results["distances"][0][i] if results.get("distances") else 0.0,
                        })
                return formatted
            except Exception:
                pass
        return self._in_memory_search(collection_name, query_embedding, k, filter_criteria)

    def _in_memory_search(
        self,
        collection_name: str,
        query_embedding: List[float],
        k: int,
        filter_criteria: Optional[Dict] = None,
    ) -> List[Dict[str, Any]]:
        col = self._in_memory.get(collection_name)
        if not col or not col.get("embeddings"):
            return []
        import math
        scores = []
        for i, emb in enumerate(col["embeddings"]):
            if filter_criteria:
                meta = col["metadatas"][i]
                if not all(meta.get(k) == v for k, v in filter_criteria.items()):
                    continue
            dot = sum(a * b for a, b in zip(query_embedding, emb))
            scores.append((i, dot))
        scores.sort(key=lambda x: -x[1])
        results = []
        for i, score in scores[:k]:
            results.append({
                "id": col["ids"][i],
                "content": col["documents"][i],
                "metadata": col["metadatas"][i],
                "score": float(score),
            })
        return results

    def delete_documents(self, collection_name: str, source_id: Optional[str] = None) -> int:
        self._init()
        if self._client is not None:
            try:
                collection = self._client.get_collection(collection_name)
                if source_id:
                    results = collection.get(where={"source_id": source_id})
                    if results["ids"]:
                        collection.delete(ids=results["ids"])
                        return len(results["ids"])
                else:
                    count = collection.count()
                    all_ids = collection.get()["ids"]
                    if all_ids:
                        collection.delete(ids=all_ids)
                    return len(all_ids)
            except Exception:
                pass
        col = self._in_memory.get(collection_name)
        if not col:
            return 0
        if source_id:
            to_delete = [i for i, m in enumerate(col["metadatas"]) if m.get("source_id") == source_id]
            for field in ["documents", "metadatas", "ids", "embeddings"]:
                col[field] = [v for i, v in enumerate(col[field]) if i not in to_delete]
            return len(to_delete)
        else:
            count = len(col["ids"])
            for field in col:
                col[field] = []
            return count

    def delete_collection(self, collection_name: str) -> bool:
        self._init()
        if self._client is not None:
            try:
                self._client.delete_collection(collection_name)
            except Exception:
                pass
        self._in_memory.pop(collection_name, None)
        return True

    def get_collection_info(self, collection_name: str) -> Optional[Dict[str, Any]]:
        self._init()
        if self._client is not None:
            try:
                col = self._client.get_collection(collection_name)
                return {"name": col.name, "count": col.count(), "metadata": col.metadata}
            except Exception:
                pass
        col = self._in_memory.get(collection_name)
        if col:
            return {"name": collection_name, "count": len(col["ids"]), "metadata": {}}
        return None

    def list_collections(self) -> List[str]:
        self._init()
        if self._client is not None:
            try:
                return [c.name for c in self._client.list_collections()]
            except Exception:
                pass
        return list(self._in_memory.keys())
