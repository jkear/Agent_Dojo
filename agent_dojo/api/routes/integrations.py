"""Integrations API routes for Composio and other external services"""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent_dojo.core.exceptions import AgentDojoException
from agent_dojo.integrations.composio_client import AppType, get_composio_manager

router = APIRouter()


# Pydantic models
class ConnectionRequest(BaseModel):
    app_type: AppType
    user_id: str


class ActionExecuteRequest(BaseModel):
    action_name: str
    connection_id: str
    parameters: dict[str, Any]


@router.get("/apps/available")
async def get_available_apps():
    """Get list of available apps for integration"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        return composio.get_available_apps()
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/apps/connect")
async def initiate_app_connection(request: ConnectionRequest):
    """Initiate OAuth connection for an app"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        return composio.initiate_connection(request.app_type, request.user_id)
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/verify/{connection_id}")
async def verify_app_connection(connection_id: str):
    """Verify OAuth connection completion"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        return composio.verify_connection(connection_id)
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/connected/{user_id}")
async def get_connected_apps(user_id: str):
    """Get user's connected apps"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        return composio.get_connected_apps(user_id)
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/apps/{connection_id}")
async def disconnect_app(connection_id: str):
    """Disconnect an app"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        success = composio.disconnect_app(connection_id)
        if success:
            return {"message": "App disconnected successfully"}
        else:
            raise HTTPException(status_code=404, detail="Connection not found")
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_type}/tools/{user_id}")
async def get_app_tools(app_type: AppType, user_id: str):
    """Get available tools for a toolkit and user (v3: uses user_id)"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        tools = composio.get_tools_for_app(app_type, user_id)
        return [
            {
                "name": getattr(tool, 'name', ''),
                "slug": getattr(tool, 'slug', ''),
                "description": getattr(tool, 'description', ''),
                "parameters": getattr(tool, 'input_parameters', {}),
            }
            for tool in tools
        ]
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/apps/{app_type}/actions/{user_id}")
async def get_app_actions(app_type: AppType, user_id: str):
    """Get available actions/tools for a toolkit (v3: renamed method)"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        return composio.get_toolkit_tools(app_type, user_id)
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/apps/execute")
async def execute_app_action(request: ActionExecuteRequest):
    """Execute a tool action (v3: uses tool_slug and user_id)"""
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503, detail="Composio integration not available"
        )

    try:
        # V3: Execute tool by slug with user_id
        # Note: request.connection_id is now interpreted as user_id
        result = composio.execute_tool(
            tool_slug=request.action_name,
            user_id=request.connection_id,  # Using connection_id field as user_id
            parameters=request.parameters
        )
        return result
    except AgentDojoException as e:
        raise HTTPException(status_code=400, detail=str(e))
