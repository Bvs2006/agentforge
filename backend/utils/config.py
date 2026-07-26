from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "gryphe/mythomax-l2-13b"

    # IBM watsonx.ai
    ibm_api_key: str = "demo_key"
    ibm_project_id: str = "demo_project"
    ibm_watsonx_url: str = "https://us-south.ml.cloud.ibm.com"

    # JWT
    jwt_secret_key: str = "super-secret-dev-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # Langflow
    langflow_url: str = "http://localhost:7860"
    langflow_api_key: str = ""

    # Frontend (CORS & SPA proxy)
    frontend_url: str = "http://localhost:3000"

    # App
    app_env: str = "development"
    app_secret: str = "dev-secret"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
