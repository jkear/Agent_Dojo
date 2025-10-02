"""FastAPI main application"""

import contextlib
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from agent_dojo.api.routes import api_router
from agent_dojo.core.config import settings
from agent_dojo.database.connection import init_db
from agent_dojo.integrations.composio_client import init_composio
from agent_dojo.observability.langfuse_client import flush_langfuse, init_langfuse
from agent_dojo.observability.telemetry import init_telemetry


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await init_db()
    init_langfuse()
    init_telemetry()
    init_composio()

    yield

    # Shutdown - flush Langfuse events before terminating
    flush_langfuse()


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title="Agent Dojo API",
        description="Modern AI agent orchestration framework with visual workflow builder",
        version="0.1.0",
        docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
        lifespan=lifespan,
    )

    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Routes
    app.include_router(api_router, prefix="/api/v1")

    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "0.1.0"}

    # Static files (for production)
    with contextlib.suppress(RuntimeError):
        app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "agent_dojo.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
