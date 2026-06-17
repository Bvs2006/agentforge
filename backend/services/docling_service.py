"""
IBM Docling Document Processing Service
Extracts text from PDFs, DOCX, TXT and structures it for agent consumption.
Falls back to basic text extraction when Docling is not installed.
"""
import os
import uuid
from pathlib import Path
from typing import Optional

UPLOAD_DIR = Path("/tmp/agentforge/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Try Docling
try:
    import docling.document_converter
    DOCLING_AVAILABLE = True
    _converter = None  # Lazy init
    print("[Docling] Available ✓")
except ImportError:
    DOCLING_AVAILABLE = False
    print("[Docling] Not installed, using basic extraction")


def _basic_extract(file_path: str) -> str:
    """Basic text extraction fallback."""
    ext = Path(file_path).suffix.lower()
    try:
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        elif ext == ".pdf":
            try:
                import pypdf
                with open(file_path, "rb") as f:
                    reader = pypdf.PdfReader(f)
                    return "\n".join(page.extract_text() or "" for page in reader.pages)
            except ImportError:
                return f"[PDF extraction requires pypdf. File: {file_path}]"
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    except Exception as e:
        return f"[Error reading file: {e}]"


def _chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list:
    """Split text into overlapping chunks for RAG."""
    words = text.split()
    if not words:
        return []
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks


def process_document(file_path: str, filename: str) -> dict:
    """Process a document file and return structured data."""
    global _converter
    doc_id = str(uuid.uuid4())

    if DOCLING_AVAILABLE:
        try:
            if _converter is None:
                from docling.document_converter import DocumentConverter
                _converter = DocumentConverter()
            result = _converter.convert(file_path)
            text = result.document.export_to_markdown()
        except Exception as e:
            print(f"[Docling] Conversion error: {e}, falling back")
            text = _basic_extract(file_path)
    else:
        text = _basic_extract(file_path)

    chunks = _chunk_text(text)
    word_count = len(text.split())

    return {
        "doc_id": doc_id,
        "filename": filename,
        "text": text,
        "chunks": chunks,
        "chunk_count": len(chunks),
        "word_count": word_count,
        "metadata": {
            "source": filename,
            "processor": "docling" if DOCLING_AVAILABLE else "basic",
            "file_path": file_path,
            "size_bytes": os.path.getsize(file_path)
        }
    }


def save_upload(file_bytes: bytes, filename: str) -> str:
    """Save uploaded file to temp directory."""
    safe_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = UPLOAD_DIR / safe_name
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return str(file_path)


def get_upload_dir() -> str:
    return str(UPLOAD_DIR)
