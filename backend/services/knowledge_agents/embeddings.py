import hashlib
import time
from typing import List, Optional, Dict, Any
from functools import lru_cache


DEFAULT_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 32
EMBEDDING_DIMENSION = 384


class EmbeddingService:
    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.model_name = model_name
        self._model = None
        self._model_loaded = False
        self._load_error: Optional[str] = None
        self._cache: Dict[str, List[float]] = {}

    def _load_model(self):
        if self._model_loaded:
            return
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
            self._model_loaded = True
        except ImportError:
            self._load_error = "sentence-transformers not installed"
        except Exception as e:
            self._load_error = str(e)

    def _get_cache_key(self, text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def embed(self, text: str) -> List[float]:
        cache_key = self._get_cache_key(text)
        if cache_key in self._cache:
            return self._cache[cache_key]
        self._load_model()
        if self._model is None:
            return self._mock_embedding(text)
        embedding = self._model.encode(text, normalize_embeddings=True).tolist()
        self._cache[cache_key] = embedding
        return embedding

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        results = []
        uncached_texts = []
        uncached_indices = []

        for i, text in enumerate(texts):
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                results.append(self._cache[cache_key])
            else:
                results.append(None)
                uncached_texts.append(text)
                uncached_indices.append(i)

        if uncached_texts:
            self._load_model()
            if self._model is None:
                embeddings = [self._mock_embedding(t) for t in uncached_texts]
            else:
                all_embeddings = []
                for batch_start in range(0, len(uncached_texts), BATCH_SIZE):
                    batch = uncached_texts[batch_start:batch_start + BATCH_SIZE]
                    batch_embeddings = self._model.encode(batch, normalize_embeddings=True)
                    all_embeddings.extend(batch_embeddings.tolist())
                embeddings = all_embeddings

            for idx, emb in zip(uncached_indices, embeddings):
                cache_key = self._get_cache_key(uncached_texts[uncached_indices.index(idx)])
                self._cache[cache_key] = emb
                results[idx] = emb

        return results

    def _mock_embedding(self, text: str) -> List[float]:
        import hashlib
        seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        import random
        rng = random.Random(seed)
        vec = [rng.random() * 2 - 1 for _ in range(EMBEDDING_DIMENSION)]
        norm = sum(x * x for x in vec) ** 0.5
        return [x / norm for x in vec]

    def is_available(self) -> bool:
        self._load_model()
        return self._model is not None

    def get_dimension(self) -> int:
        return EMBEDDING_DIMENSION
