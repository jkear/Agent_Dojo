"""Tools API routes"""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent_dojo.tools.tool_manager import ToolCategory, ToolManager

router = APIRouter()


# Pydantic models
class ToolExecuteRequest(BaseModel):
    parameters: dict[str, Any]
    user_permissions: list[str] | None = []


# Global tool manager
tool_manager = ToolManager()


@router.get("/", response_model=list[dict])
async def list_tools(category: ToolCategory | None = None):
    """List available tools"""
    tools = tool_manager.list_tools(category=category)

    return [
        {
            "name": tool.name,
            "description": tool.description,
            "category": tool.config.category.value,
            "version": tool.config.version,
            "status": tool.status.value,
            "parameters_schema": tool.config.parameters_schema,
            "required_permissions": tool.config.required_permissions,
        }
        for tool in tools
    ]


@router.get("/{tool_name}", response_model=dict)
async def get_tool(tool_name: str):
    """Get tool details"""
    tool = tool_manager.get_tool(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    return {
        "name": tool.name,
        "description": tool.description,
        "category": tool.config.category.value,
        "version": tool.config.version,
        "status": tool.status.value,
        "parameters_schema": tool.config.parameters_schema,
        "required_permissions": tool.config.required_permissions,
        "configuration": tool.config.configuration,
    }


@router.post("/{tool_name}/execute")
async def execute_tool(tool_name: str, request: ToolExecuteRequest):
    """Execute a tool"""
    try:
        result = await tool_manager.execute_tool(
            tool_name=tool_name,
            parameters=request.parameters,
            user_permissions=request.user_permissions,
        )

        return {
            "success": True,
            "result": result,
            "tool_name": tool_name,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "tool_name": tool_name,
        }


@router.get("/{tool_name}/schema")
async def get_tool_schema(tool_name: str):
    """Get tool parameter schema"""
    schema = tool_manager.get_tool_schema(tool_name)
    if not schema:
        raise HTTPException(status_code=404, detail="Tool not found")

    return schema


@router.get("/categories/list")
async def list_categories():
    """List available tool categories"""
    return [
        {
            "name": category.name,
            "value": category.value,
        }
        for category in ToolCategory
    ]


@router.get("/agent/{agent_role}")
async def get_tools_for_agent(agent_role: str, permissions: list[str] | None = None):
    """Get tools suitable for a specific agent role"""
    tools = tool_manager.get_tools_for_agent(agent_role, permissions or [])

    return [
        {
            "name": tool.name,
            "description": tool.description,
            "category": tool.config.category.value,
        }
        for tool in tools
    ]


@router.get("/export/config")
async def export_tools_config():
    """Export all tool configurations"""
    return tool_manager.export_tools_config()
