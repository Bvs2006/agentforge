import httpx
import json
from typing import Optional, List, Dict, Any
from utils.config import settings


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FREE_MODELS = [
    "gryphe/mythomax-l2-13b",
    "microsoft/phi-3-mini-128k-instruct",
    "cognitivecomputations/dolphin-mixtral-8x7b",
]


def _get_api_key() -> Optional[str]:
    key = getattr(settings, "openrouter_api_key", None) or getattr(settings, "OPENROUTER_API_KEY", None)
    if key and key != "demo_key" and key != "":
        return key
    return None


def get_model() -> Optional[str]:
    model = getattr(settings, "openrouter_model", None)
    if model:
        return model
    return FREE_MODELS[0]


async def generate_text(prompt: str, model: Optional[str] = None) -> Optional[str]:
    api_key = _get_api_key()
    if not api_key:
        return None

    model = model or get_model()

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AgentForge",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[OpenRouter] Error: {e}")
        return None


async def generate_chat(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
) -> Optional[str]:
    api_key = _get_api_key()
    if not api_key:
        return None

    model = model or get_model()

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AgentForge",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[OpenRouter] Error: {e}")
        return None
