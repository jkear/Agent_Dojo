"""Composio integration API routes"""

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from agent_dojo.integrations.composio_client import get_composio_manager
from agent_dojo.schemas.composio import (
    ConnectionInfo,
    ConnectionInitiateResponse,
    ConnectionListResponse,
    ConnectionRequest,
    ConnectionStatus,
    ConnectionStatusResponse,
    ToolDefinitionListResponse,
    ToolExecutionRequest,
    ToolExecutionResponse,
    ToolkitInfo,
    ToolkitListResponse,
)

router = APIRouter(prefix="/api/v1/composio", tags=["composio"])


@router.get("/toolkits", response_model=ToolkitListResponse)
async def list_toolkits(
    search: str | None = Query(None, description="Search query"),
    category: str | None = Query(None, description="Filter by category"),
):
    """
    Get list of available Composio toolkits/apps.
    
    Supports filtering by search query and category.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        available_apps = composio.get_available_apps()
        
        # Convert to ToolkitInfo objects
        toolkits = [
            ToolkitInfo(
                slug=app["app_id"],
                name=app["name"],
                description=app["description"],
                logo_url=app.get("logo"),
                categories=app.get("categories", []),
                auth_schemes=[],  # TODO: Parse auth_schemes properly
            )
            for app in available_apps
        ]
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            toolkits = [
                t
                for t in toolkits
                if search_lower in t.name.lower()
                or search_lower in t.description.lower()
                or search_lower in t.slug.lower()
            ]
        
        # Apply category filter
        if category:
            toolkits = [t for t in toolkits if category in t.categories]
        
        return ToolkitListResponse(data=toolkits)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "TOOLKIT_LIST_FAILED",
                "message": f"Failed to list toolkits: {str(e)}",
            },
        )


@router.get("/toolkits/{toolkit_slug}/tools", response_model=ToolDefinitionListResponse)
async def get_toolkit_tools(toolkit_slug: str):
    """
    Get raw tool definitions for a specific toolkit.
    
    Returns complete metadata including input_parameters, output_parameters,
    scopes, and auth requirements.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        raw_definitions = composio.get_raw_tool_definitions(toolkit_slug)
        
        # Convert to ToolDefinition objects
        from agent_dojo.schemas.composio import ToolDefinition, ToolSchema
        
        tools = []
        for raw_def in raw_definitions:
            tool = ToolDefinition(
                name=raw_def["name"],
                slug=raw_def["slug"],
                description=raw_def["description"],
                input_parameters=ToolSchema(**raw_def.get("input_parameters", {}))
                if isinstance(raw_def.get("input_parameters"), dict)
                else ToolSchema(),
                output_parameters=ToolSchema(**raw_def.get("output_parameters", {}))
                if isinstance(raw_def.get("output_parameters"), dict)
                else ToolSchema(),
                scopes=raw_def.get("scopes", []),
                no_auth=raw_def.get("no_auth", False),
                version=raw_def.get("version"),
            )
            tools.append(tool)
        
        return ToolDefinitionListResponse(data=tools)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "TOOL_DEFINITIONS_FAILED",
                "message": f"Failed to get tool definitions for {toolkit_slug}: {str(e)}",
                "toolkit": toolkit_slug,
            },
        )


@router.get("/toolkits/{toolkit_slug}/metadata")
async def get_toolkit_metadata(toolkit_slug: str) -> dict[str, Any]:
    """
    Get metadata for a specific toolkit including auth schemes and categories.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        metadata = composio.get_toolkit_metadata(toolkit_slug)
        return {"success": True, "data": metadata, "message": "Metadata retrieved successfully"}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "METADATA_FAILED",
                "message": f"Failed to get metadata for {toolkit_slug}: {str(e)}",
                "toolkit": toolkit_slug,
            },
        )


@router.post("/connections/initiate", response_model=dict[str, Any])
async def initiate_connection(request: ConnectionRequest):
    """
    Initiate OAuth connection for a toolkit.
    
    Returns auth_url for user to complete OAuth flow.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        from agent_dojo.integrations.composio_client import AppType
        
        # Convert toolkit_slug to AppType
        try:
            app_type = AppType(request.toolkit_slug.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_TOOLKIT",
                    "message": f"Toolkit '{request.toolkit_slug}' is not supported",
                    "toolkit": request.toolkit_slug,
                },
            )
        
        result = composio.initiate_connection(app_type, request.user_id)
        
        return {
            "success": True,
            "data": ConnectionInitiateResponse(
                connection_id=result["connection_id"],
                auth_url=result["auth_url"],
                toolkit_slug=result["app_type"],
                status=ConnectionStatus(result["status"]),
            ),
            "message": "Connection initiated successfully",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "CONNECTION_INITIATION_FAILED",
                "message": f"Failed to initiate connection: {str(e)}",
            },
        )


@router.get("/connections/{connection_id}/status", response_model=dict[str, Any])
async def check_connection_status(connection_id: str):
    """
    Check the status of a connection.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        result = composio.verify_connection(connection_id)
        
        return {
            "success": True,
            "data": ConnectionStatusResponse(
                connection_id=connection_id,
                status=ConnectionStatus.ACTIVE
                if result["status"] == "connected"
                else ConnectionStatus.PENDING,
                message=result.get("status"),
            ),
            "message": "Connection status retrieved successfully",
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "STATUS_CHECK_FAILED",
                "message": f"Failed to check connection status: {str(e)}",
                "connection_id": connection_id,
            },
        )


@router.get("/users/{user_id}/connections", response_model=ConnectionListResponse)
async def get_user_connections(user_id: str):
    """
    Get all connections for a specific user.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        connections = composio.get_connected_apps(user_id)
        
        # Convert to ConnectionInfo objects
        connection_infos = [
            ConnectionInfo(
                connection_id=conn["connection_id"],
                app_type=conn.get("app_type", "unknown"),
                status=ConnectionStatus(conn["status"]),
                created_at=conn.get("created_at"),
                updated_at=None,
            )
            for conn in connections
        ]
        
        return ConnectionListResponse(data=connection_infos)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "CONNECTION_LIST_FAILED",
                "message": f"Failed to list connections for user: {str(e)}",
                "user_id": user_id,
            },
        )


@router.delete("/connections/{connection_id}")
async def disconnect_app(connection_id: str):
    """
    Disconnect an app connection.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        success = composio.disconnect_app(connection_id)
        
        return {
            "success": success,
            "data": {"connection_id": connection_id},
            "message": "App disconnected successfully",
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "DISCONNECT_FAILED",
                "message": f"Failed to disconnect app: {str(e)}",
                "connection_id": connection_id,
            },
        )


@router.post("/tools/execute", response_model=dict[str, Any])
async def execute_tool(request: ToolExecutionRequest):
    """
    Execute a Composio tool.
    """
    composio = get_composio_manager()
    if not composio:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "COMPOSIO_UNAVAILABLE",
                "message": "Composio integration is not configured",
            },
        )

    try:
        result = composio.execute_tool(
            tool_slug=request.tool_slug,
            user_id=request.user_id,
            parameters=request.parameters,
        )
        
        return {
            "success": result["success"],
            "data": ToolExecutionResponse(
                success=result["success"],
                result=result.get("result"),
                error=result.get("error"),
                tool_slug=request.tool_slug,
            ),
            "message": "Tool executed successfully"
            if result["success"]
            else "Tool execution failed",
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "TOOL_EXECUTION_FAILED",
                "message": f"Failed to execute tool: {str(e)}",
                "tool_slug": request.tool_slug,
            },
        )
