import re
from typing import List, Optional, Dict, Any, Callable
from enum import Enum

from .models import Chunk


class ChunkStrategy(str, Enum):
    RECURSIVE = "recursive"
    TOKEN = "token"
    DOCUMENT_AWARE = "document_aware"
    SENTENCE = "sentence"
    PARAGRAPH = "paragraph"


DEFAULT_CHUNK_SIZE = 500
DEFAULT_OVERLAP = 50


class ChunkingService:
    def __init__(self):
        self.strategies: Dict[ChunkStrategy, Callable] = {
            ChunkStrategy.RECURSIVE: self._chunk_recursive,
            ChunkStrategy.TOKEN: self._chunk_token,
            ChunkStrategy.DOCUMENT_AWARE: self._chunk_document_aware,
            ChunkStrategy.SENTENCE: self._chunk_sentence,
            ChunkStrategy.PARAGRAPH: self._chunk_paragraph,
        }

    def chunk(
        self,
        text: str,
        strategy: ChunkStrategy = ChunkStrategy.RECURSIVE,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        overlap: int = DEFAULT_OVERLAP,
        metadata: Optional[Dict[str, Any]] = None,
        source_id: str = "",
    ) -> List[Chunk]:
        if not text or not text.strip():
            return []

        chunker = self.strategies.get(strategy, self._chunk_recursive)
        raw_chunks = chunker(text, chunk_size, overlap)
        base_metadata = metadata or {}

        result = []
        for i, content in enumerate(raw_chunks):
            content = content.strip()
            if not content:
                continue
            chunk = Chunk(
                id=f"{source_id}_chunk_{i}" if source_id else f"chunk_{i}",
                content=content,
                metadata={
                    **base_metadata,
                    "chunk_index": i,
                    "chunk_count": len(raw_chunks),
                    "chunk_size": len(content),
                    "strategy": strategy.value,
                },
                source_id=source_id,
                index=i,
            )
            result.append(chunk)

        return result

    def _chunk_recursive(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        separators = ["\n\n", "\n", ". ", " ", ""]
        chunks = []
        current = text
        while current:
            if len(current) <= chunk_size:
                chunks.append(current)
                break
            split_point = self._find_split(current, chunk_size, separators)
            chunks.append(current[:split_point])
            current = current[split_point - overlap:] if split_point > overlap else current[split_point:]
        return chunks

    def _chunk_token(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + chunk_size]
            chunks.append(" ".join(chunk_words))
            i += chunk_size - overlap
            if i >= len(words):
                break
        return chunks

    def _chunk_document_aware(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        sections = re.split(r"(^#+\s+.*$)", text, flags=re.MULTILINE)
        if len(sections) <= 1:
            return self._chunk_recursive(text, chunk_size, overlap)
        chunks = []
        for section in sections:
            if not section.strip():
                continue
            if section.startswith("#"):
                chunks.append(section)
            else:
                sub_chunks = self._chunk_recursive(section, chunk_size, overlap)
                if chunks and sub_chunks:
                    chunks[-1] = chunks[-1] + "\n" + sub_chunks[0]
                    chunks.extend(sub_chunks[1:])
                else:
                    chunks.extend(sub_chunks)
        return chunks

    def _chunk_sentence(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks = []
        current = []
        current_len = 0
        for sentence in sentences:
            sentence_len = len(sentence.split())
            if current_len + sentence_len > chunk_size and current:
                chunks.append(" ".join(current))
                overlap_sentences = current[-overlap:] if overlap < len(current) else current
                current = list(overlap_sentences)
                current_len = len(current)
            current.append(sentence)
            current_len += sentence_len
        if current:
            chunks.append(" ".join(current))
        return chunks

    def _chunk_paragraph(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        paragraphs = re.split(r"\n\s*\n", text)
        chunks = []
        current = []
        current_len = 0
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            para_len = len(para.split())
            if current_len + para_len > chunk_size and current:
                chunks.append("\n\n".join(current))
                overlap_paras = current[-overlap:] if overlap < len(current) else current
                current = list(overlap_paras)
                current_len = sum(len(p.split()) for p in current)
            current.append(para)
            current_len += para_len
        if current:
            chunks.append("\n\n".join(current))
        return chunks

    def _find_split(self, text: str, target: int, separators: List[str]) -> int:
        for sep in separators:
            if not sep:
                return target
            pos = text.rfind(sep, 0, target)
            if pos != -1:
                return pos + len(sep)
        return target
