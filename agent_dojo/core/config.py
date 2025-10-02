"""Application configuration"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True
    )

    # Application
    ENVIRONMENT: str = Field(default="development")
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production")
    DEBUG: bool = Field(default=False)

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/agent_dojo"
    )

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Authentication
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24 * 7)  # 7 days

    # External Services
    OPENAI_API_KEY: str | None = Field(default=None)
    ANTHROPIC_API_KEY: str | None = Field(default=None)
    GOOGLE_API_KEY: str | None = Field(default=None)

    # Observability - Langfuse
    LANGFUSE_PUBLIC_KEY: str | None = Field(default=None)
    LANGFUSE_SECRET_KEY: str | None = Field(default=None)
    LANGFUSE_HOST: str = Field(default="http://localhost:3001")

    # Integrations - Composio
    COMPOSIO_API_KEY: str | None = Field(default=None)

    # MCP
    MCP_SERVER_PORT: int = Field(default=8001)

    # File Storage
    UPLOAD_MAX_SIZE: int = Field(default=10 * 1024 * 1024)  # 10MB
    ALLOWED_FILE_TYPES: list[str] = Field(
        default=[".txt", ".pdf", ".docx", ".xlsx", ".csv", ".json", ".yaml", ".yml"]
    )

    # Workflow Execution
    MAX_WORKFLOW_EXECUTION_TIME: int = Field(default=300)  # 5 minutes
    MAX_PARALLEL_AGENTS: int = Field(default=5)

    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=100)

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Get synchronous database URL for Alembic"""
        return self.DATABASE_URL.replace("+asyncpg", "")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
