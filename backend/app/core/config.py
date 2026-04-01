"""
AGENMATICA - Application Configuration
Centralized settings with mock/real toggle support.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "AGENMATICA"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-key-change-in-production"
    api_version: str = "v1"
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:5173"

    # --- Database ---
    database_url: str = "postgresql+asyncpg://agenmatica:agenmatica@localhost:5432/agenmatica"
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Celery ---
    celery_broker_url: str = "amqp://guest:guest@localhost:5672//"
    celery_result_backend: str = "redis://localhost:6379/1"

    # --- JWT ---
    jwt_secret_key: str = "dev-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # --- Together.ai (LLM) ---
    together_api_key: str = ""
    together_model: str = "meta-llama/Llama-2-13b-chat-hf"
    together_max_tokens: int = 1024
    together_temperature: float = 0.7

    # --- Replicate (Images) ---
    replicate_api_token: str = ""
    replicate_model: str = "black-forest-labs/flux-pro"

    # --- Instagram ---
    instagram_app_id: str = ""
    instagram_app_secret: str = ""
    instagram_redirect_uri: str = "http://localhost:8000/api/v1/auth/instagram/callback"

    # --- TikTok ---
    tiktok_client_key: str = ""
    tiktok_client_secret: str = ""

    # --- Stripe ---
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # --- SendGrid ---
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "hello@agenmatica.com"

    # --- Sentry ---
    sentry_dsn: str = ""

    # --- Feature Flags (MOCK mode for dev without keys) ---
    mock_llm: bool = True
    mock_social_apis: bool = True
    mock_image_gen: bool = True
    mock_payments: bool = True
    mock_email: bool = True

    # --- Post Generation ---
    posts_per_day: int = 5
    post_generation_hour: int = 8
    engagement_analysis_hour: int = 21
    learning_loop_day: str = "sunday"

    # --- Embeddings ---
    embedding_dimensions: int = 1536

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def api_prefix(self) -> str:
        return f"/api/{self.api_version}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
