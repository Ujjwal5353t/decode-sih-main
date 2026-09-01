from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Admin seed
    ADMIN_EMAIL: str = "admin003@gmail.com"
    ADMIN_PASSWORD: str = "123456789"

    # App
    APP_NAME: str = "Decode-SIH API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Startup DB & Seed flags (disabled by default on server restart)
    AUTO_CREATE_TABLES: bool = False
    AUTO_SEED: bool = False

    # LLM — used by scripts/generate_questions.py (offline question-bank
    # generation) AND by the running app server (src/ai/quiz_summary_service.py,
    # background AI result-summary generation after a diagnostic completes).
    # Optional so the main app's startup isn't affected if unset; the summary
    # background task just marks itself ai_summary_status="failed" instead.
    GEMINI_API_KEY: Optional[str] = None
    # Pinned rather than an alias — model free-tier access varies wildly by
    # model on a freshly created API key: gemini-flash-latest resolved to
    # gemini-3.6-flash (20 req/day cap), the whole 2.5 line 404s as
    # "no longer available to new users", and gemini-2.0-flash/-lite report
    # a hard 0 free quota. gemini-3.5-flash-lite is what actually has a
    # working free quota for a new key as of Aug 2026 — Lite variants of the
    # newest generation, not the newest full model, turned out to be the
    # generous tier. Re-verify with scripts/generate_questions.py --dry-run
    # if this starts 404ing/429ing again — model availability rotates fast.
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"


settings = Settings()  # type: ignore[call-arg]
