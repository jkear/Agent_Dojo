"""API routes aggregation"""

from fastapi import APIRouter

from agent_dojo.api.routes.agents import router as agents_router
from agent_dojo.api.routes.canvas import router as canvas_router
from agent_dojo.api.routes.composio import router as composio_router
from agent_dojo.api.routes.integrations import router as integrations_router
from agent_dojo.api.routes.tools import router as tools_router
from agent_dojo.api.routes.workflows import router as workflows_router

api_router = APIRouter()

# Include all route modules
api_router.include_router(agents_router, prefix="/agents", tags=["agents"])
api_router.include_router(workflows_router, prefix="/workflows", tags=["workflows"])
api_router.include_router(tools_router, prefix="/tools", tags=["tools"])
api_router.include_router(
    integrations_router, prefix="/integrations", tags=["integrations"]
)
api_router.include_router(canvas_router, prefix="/canvas", tags=["canvas"])
api_router.include_router(composio_router, tags=["composio"])
