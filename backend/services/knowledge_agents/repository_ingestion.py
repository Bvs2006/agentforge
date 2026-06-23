import os
import tempfile
import asyncio
from typing import List, Optional, Set
from datetime import datetime
from pathlib import Path

from .security import validate_path, sanitize_repo_path, is_safe_repo_path, ALLOWED_EXTENSIONS, BLOCKED_DIRS, MAX_FILES, MAX_DEPTH
from .models import KnowledgeSource, SourceType, Chunk


class RepositoryIngestion:
    def __init__(self):
        self._git_available = False
        try:
            import git
            self._git_available = True
        except ImportError:
            pass

    async def ingest(
        self,
        repo_url: str,
        branch: str = "main",
        source: Optional[KnowledgeSource] = None,
    ) -> dict:
        repo_path = None
        try:
            repo_path = await self._clone_repo(repo_url, branch)
            return self._process_local_path(repo_path, source, repo_url=repo_url)
        finally:
            if repo_path and os.path.exists(repo_path):
                import shutil
                shutil.rmtree(repo_path, ignore_errors=True)

    def ingest_local(
        self,
        folder_path: str,
        source: Optional[KnowledgeSource] = None,
    ) -> dict:
        abs_path = validate_path(folder_path)
        return self._process_local_path(abs_path, source)

    def _process_local_path(
        self,
        folder_path: str,
        source: Optional[KnowledgeSource] = None,
        repo_url: str = "",
    ) -> dict:
        abs_path = sanitize_repo_path(folder_path)
        files_text = []
        tree_lines = []
        file_count = 0
        total_size = 0
        extensions_found: Set[str] = set()

        for root, dirs, files in os.walk(abs_path):
            dirs[:] = [d for d in dirs if d not in BLOCKED_DIRS]
            depth = root[len(abs_path):].count(os.sep)
            if depth > MAX_DEPTH:
                dirs.clear()
                continue

            rel_root = os.path.relpath(root, abs_path)
            for f in sorted(files):
                ext = os.path.splitext(f)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    continue
                file_count += 1
                if file_count > MAX_FILES:
                    break
                file_path = os.path.join(root, f)
                rel_path = os.path.relpath(file_path, abs_path)
                try:
                    size = os.path.getsize(file_path)
                    total_size += size
                    with open(file_path, "r", encoding="utf-8", errors="replace") as fh:
                        content = fh.read()
                    files_text.append(f"--- File: {rel_path} ---\n{content}")
                    tree_lines.append(rel_path)
                    extensions_found.add(ext)
                except Exception:
                    tree_lines.append(rel_path)
            if file_count > MAX_FILES:
                break

        combined_text = "\n\n".join(files_text)
        repo_name = os.path.basename(abs_path)
        metadata = {
            "repository": repo_url or repo_name,
            "folder_path": abs_path,
            "file_count": file_count,
            "total_size_bytes": total_size,
            "extensions": list(extensions_found),
            "tree": tree_lines,
            "source_type": SourceType.REPOSITORY.value,
            "extracted_at": datetime.utcnow().isoformat(),
        }

        result = {
            "text": combined_text,
            "metadata": metadata,
            "source_type": SourceType.REPOSITORY,
        }

        if source:
            source.metadata.update(metadata)

        return result

    async def _clone_repo(self, repo_url: str, branch: str = "main") -> str:
        import git
        repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
        tmp_dir = tempfile.mkdtemp(prefix=f"repo_{repo_name}_")
        clone_path = os.path.join(tmp_dir, repo_name)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: git.Repo.clone_from(repo_url, clone_path, branch=branch, depth=1),
        )
        return clone_path
