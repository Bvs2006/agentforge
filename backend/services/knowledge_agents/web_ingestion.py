import re
import asyncio
from typing import List, Optional, Set
from datetime import datetime
from urllib.parse import urljoin, urlparse

from .security import validate_url, RateLimiter, SecurityError
from .models import KnowledgeSource, SourceType, Chunk


class WebIngestion:
    def __init__(self):
        self._httpx_available = False
        self._bs4_available = False
        try:
            import httpx
            self._httpx_available = True
        except ImportError:
            pass
        try:
            from bs4 import BeautifulSoup
            self._bs4_available = True
        except ImportError:
            pass
        self.rate_limiter = RateLimiter(max_calls=30, window_seconds=60)
        self.visited: Set[str] = set()

    async def ingest(
        self,
        url: str,
        max_depth: int = 2,
        max_pages: int = 20,
        source: Optional[KnowledgeSource] = None,
    ) -> dict:
        validated_url = validate_url(url)
        self.visited.clear()
        pages = await self._crawl(validated_url, max_depth=max_depth, max_pages=max_pages)
        combined_text = ""
        all_metadata = {
            "root_url": validated_url,
            "pages_crawled": len(pages),
            "depth": max_depth,
            "source_type": SourceType.WEBSITE.value,
            "extracted_at": datetime.utcnow().isoformat(),
        }
        page_details = []
        for page_url, page_data in pages:
            combined_text += f"\n\n=== Page: {page_url} ===\n\n{page_data['text']}"
            page_details.append({
                "url": page_url,
                "title": page_data.get("title", ""),
                "word_count": page_data.get("word_count", 0),
            })
        all_metadata["pages"] = page_details

        result = {
            "text": combined_text,
            "metadata": all_metadata,
            "source_type": SourceType.WEBSITE,
        }

        if source:
            source.metadata.update(all_metadata)

        return result

    async def ingest_single(self, url: str) -> dict:
        validated_url = validate_url(url)
        if not self.rate_limiter.check("web_ingestion"):
            raise SecurityError("Rate limit exceeded for web ingestion")
        text, metadata = await self._fetch_and_parse(validated_url)
        metadata["source_type"] = SourceType.WEBSITE.value
        return {
            "text": text,
            "metadata": metadata,
            "source_type": SourceType.WEBSITE,
        }

    async def _crawl(self, start_url: str, max_depth: int, max_pages: int) -> List[tuple]:
        pages = []
        to_visit = [(start_url, 0)]
        base_domain = urlparse(start_url).netloc
        while to_visit and len(pages) < max_pages:
            url, depth = to_visit.pop(0)
            if url in self.visited:
                continue
            if depth > max_depth:
                continue
            if urlparse(url).netloc != base_domain:
                continue
            self.visited.add(url)
            try:
                text, metadata = await self._fetch_and_parse(url)
                pages.append((url, {"text": text, **metadata}))
                links = metadata.get("links", [])
                for link in links:
                    if link not in self.visited and len(pages) + len(to_visit) < max_pages:
                        to_visit.append((link, depth + 1))
            except Exception:
                pass
        return pages

    async def _fetch_and_parse(self, url: str) -> tuple:
        if not self._httpx_available:
            return f"[Web fetching requires httpx] URL: {url}", {}
        import httpx
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "AgentForge Knowledge Agent/1.0"})
            response.raise_for_status()
            html = response.text
        if self._bs4_available:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            title = soup.title.string.strip() if soup.title else ""
            text = soup.get_text(separator="\n", strip=True)
            text = re.sub(r"\n{3,}", "\n\n", text)
            word_count = len(text.split())
            links = []
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                full_url = urljoin(url, href)
                if full_url.startswith("http"):
                    links.append(full_url)
            metadata = {
                "title": title,
                "word_count": word_count,
                "links": links[:50],
                "url": url,
            }
        else:
            text = html[:100000]
            metadata = {"url": url}
        return text, metadata
