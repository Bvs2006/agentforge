from datetime import datetime, timedelta
import json
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
try:
    import redis
except Exception:
    redis = None
from utils.config import settings
import uuid

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

users_db: dict = {}

try:
    _redis = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        decode_responses=True,
        socket_connect_timeout=2,
    ) if redis else None
    if _redis:
        _redis.ping()
        REDIS_AVAILABLE = True
    else:
        REDIS_AVAILABLE = False
except Exception:
    _redis = None
    REDIS_AVAILABLE = False

_AUTH_USERS_KEY = "auth:users"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expiry_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None

def register_user(username: str, email: str, password: str) -> dict:
    if get_user_by_email(email):
        return None

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": username,
        "email": email,
        "password": hash_password(password)
    }

    if REDIS_AVAILABLE:
        _redis.hset(_AUTH_USERS_KEY, email, json.dumps(user))
    else:
        users_db[email] = user

    return user

def get_user_by_email(email: str) -> Optional[dict]:
    if REDIS_AVAILABLE:
        raw = _redis.hget(_AUTH_USERS_KEY, email)
        return json.loads(raw) if raw else None
    return users_db.get(email)
