"""Database connection and initialization"""

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool, StaticPool

from agent_dojo.core.config import settings


class Base(DeclarativeBase):
    """Base class for database models"""

    pass


# Configure engine based on database type
engine_kwargs: dict[str, Any] = {
    "echo": settings.DEBUG,
    "future": True,
}

# SQLite requires StaticPool for async operations
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["poolclass"] = StaticPool
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["poolclass"] = NullPool

# Create async engine
engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db() -> None:
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models to ensure they're registered
        from agent_dojo.database import models  # noqa

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
