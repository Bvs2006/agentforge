"""
IBM Context Forge — Memory & Context Management
Stores agent configs, user preferences, conversation history, and long-term memory.
Uses Redis when available, falls back to in-memory dict.
"""
import json
from datetime import datetime
from typing import Optional
from utils.config import settings

# In-memory fallback store
_memory_store: dict = {}

# Try Redis
try:
    import redis
    _redis = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        decode_responses=True,
        socket_connect_timeout=2
    )
    _redis.ping()
    REDIS_AVAILABLE = True
    print("[ContextForge] Redis connected ✓")
except Exception:
    _redis = None
    REDIS_AVAILABLE = False
    print("[ContextForge] Redis not available, using in-memory store")


def _set(key: str, value: str, ex: Optional[int] = None):
    if REDIS_AVAILABLE:
        _redis.set(key, value, ex=ex)
    else:
        _memory_store[key] = value


def _get(key: str) -> Optional[str]:
    if REDIS_AVAILABLE:
        return _redis.get(key)
    return _memory_store.get(key)


def _rpush(key: str, value: str):
    if REDIS_AVAILABLE:
        _redis.rpush(key, value)
        _redis.ltrim(key, -50, -1)
    else:
        if key not in _memory_store:
            _memory_store[key] = []
        _memory_store[key].append(value)
        _memory_store[key] = _memory_store[key][-50:]


def _lrange(key: str) -> list:
    if REDIS_AVAILABLE:
        return _redis.lrange(key, 0, -1)
    val = _memory_store.get(key, [])
    return val if isinstance(val, list) else []


def _hset(key: str, field: str, value: str):
    if REDIS_AVAILABLE:
        _redis.hset(key, field, value)
    else:
        if key not in _memory_store:
            _memory_store[key] = {}
        _memory_store[key][field] = value


def _hgetall(key: str) -> dict:
    if REDIS_AVAILABLE:
        return _redis.hgetall(key) or {}
    val = _memory_store.get(key, {})
    return val if isinstance(val, dict) else {}


# ---- Public API ----

def store_agent_config(user_id: str, config: dict):
    _hset(f"user:{user_id}:agents", config["name"], json.dumps(config))


def get_agent_configs(user_id: str) -> dict:
    raw = _hgetall(f"user:{user_id}:agents")
    return {k: json.loads(v) for k, v in raw.items()}


def delete_agent_config(user_id: str, agent_name: str):
    if REDIS_AVAILABLE:
        _redis.hdel(f"user:{user_id}:agents", agent_name)
    else:
        store = _memory_store.get(f"user:{user_id}:agents", {})
        store.pop(agent_name, None)


def store_conversation(user_id: str, role: str, content: str, task_id: Optional[str] = None):
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
        "task_id": task_id
    }
    _rpush(f"user:{user_id}:history", json.dumps(message))


def get_conversation_history(user_id: str) -> list:
    raw = _lrange(f"user:{user_id}:history")
    return [json.loads(m) for m in raw]


def store_preference(user_id: str, key: str, value):
    prefs = get_preferences(user_id)
    prefs[key] = value
    _set(f"user:{user_id}:preferences", json.dumps(prefs))


def get_preferences(user_id: str) -> dict:
    raw = _get(f"user:{user_id}:preferences")
    return json.loads(raw) if raw else {}


def store_task_result(task_id: str, result: dict):
    _set(f"task:{task_id}", json.dumps(result), ex=86400)  # 24h TTL


def get_task_result(task_id: str) -> Optional[dict]:
    raw = _get(f"task:{task_id}")
    return json.loads(raw) if raw else None


def get_user_context(user_id: str) -> dict:
    return {
        "history": get_conversation_history(user_id)[-10:],  # last 10 messages
        "agents": get_agent_configs(user_id),
        "preferences": get_preferences(user_id),
        "memory_backend": "redis" if REDIS_AVAILABLE else "in-memory"
    }


def clear_user_data(user_id: str):
    keys = [
        f"user:{user_id}:history",
        f"user:{user_id}:agents",
        f"user:{user_id}:preferences"
    ]
    if REDIS_AVAILABLE:
        _redis.delete(*keys)
    else:
        for k in keys:
            _memory_store.pop(k, None)
