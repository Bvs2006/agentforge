import os
import re
import time
from pathlib import Path
from typing import Optional, Set
from urllib.parse import urlparse


APPROVED_BASE_DIRS = [
    os.path.abspath("/tmp/agentforge"),
    os.path.abspath("."),
]

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

ALLOWED_EXTENSIONS: Set[str] = {
    ".pdf", ".docx", ".doc", ".txt", ".md", ".markdown",
    ".csv", ".xlsx", ".xls",
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs",
    ".c", ".cpp", ".h", ".hpp", ".rb", ".php", ".swift", ".kt",
    ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg",
    ".html", ".css", ".scss", ".less",
    ".xml", ".svg", ".sql",
    ".sh", ".bat", ".ps1",
    ".mdx",
}

BLOCKED_DIRS: Set[str] = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    ".tox", ".eggs", "dist", "build", ".next", ".nuxt",
    "target", "bin", "obj",
}

MAX_REPO_SIZE_MB = 500
MAX_DEPTH = 10
MAX_FILES = 10000


class SecurityError(Exception):
    pass


def validate_path(file_path: str, base_dir: Optional[str] = None) -> str:
    abs_path = os.path.abspath(file_path)
    resolved = str(Path(abs_path).resolve())

    if base_dir:
        base = os.path.abspath(base_dir)
        if not resolved.startswith(base):
            raise SecurityError(f"Path {resolved} is outside allowed base directory {base}")

    allowed = False
    for adir in APPROVED_BASE_DIRS:
        if resolved.startswith(os.path.abspath(adir)):
            allowed = True
            break
    if not allowed and base_dir is None:
        raise SecurityError(f"Path {resolved} is outside approved directories")

    if not os.path.exists(resolved):
        raise SecurityError(f"Path {resolved} does not exist")

    if os.path.isdir(resolved):
        return resolved

    ext = os.path.splitext(resolved)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise SecurityError(f"File extension {ext} is not allowed")

    size = os.path.getsize(resolved)
    if size > MAX_FILE_SIZE_BYTES:
        raise SecurityError(f"File size {size} exceeds maximum {MAX_FILE_SIZE_BYTES}")

    return resolved


def validate_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise SecurityError(f"File type {ext} is not supported")
    return ext


def validate_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SecurityError("Only HTTP and HTTPS URLs are allowed")
    if not parsed.netloc:
        raise SecurityError("URL must have a valid hostname")
    blocked_domains = ["localhost", "127.0.0.1", "0.0.0.0"]
    if parsed.hostname in blocked_domains:
        raise SecurityError("Localhost URLs are not allowed")
    return url


def is_safe_repo_path(path: str) -> bool:
    parts = Path(path).parts
    for part in parts:
        if part in BLOCKED_DIRS:
            return False
    return True


def sanitize_repo_path(repo_path: str) -> str:
    resolved = os.path.abspath(repo_path)
    for blocked in BLOCKED_DIRS:
        if f"{os.sep}{blocked}{os.sep}" in resolved or resolved.endswith(f"{os.sep}{blocked}"):
            raise SecurityError(f"Path contains blocked directory: {blocked}")
    return resolved


class RateLimiter:
    def __init__(self, max_calls: int = 60, window_seconds: int = 60):
        self.max_calls = max_calls
        self.window = window_seconds
        self.calls: dict = {}

    def check(self, key: str) -> bool:
        now = time.time()
        if key not in self.calls:
            self.calls[key] = []
        self.calls[key] = [t for t in self.calls[key] if now - t < self.window]
        if len(self.calls[key]) >= self.max_calls:
            return False
        self.calls[key].append(now)
        return True
