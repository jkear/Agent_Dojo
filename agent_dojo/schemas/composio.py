"""Pydantic schemas for Composio integration"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AuthSchemeType(str, Enum):
    """Authentication scheme types"""

    OAUTH2 = "oauth2"
    OAUTH1 = "oauth1"
    API_KEY = "api_key"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"


class AuthSchemeFields(BaseModel):
    """Authentication scheme field requirements"""

    required: list[str] = Field(default_factory=list)
    optional: list[str] = Field(default_factory=list)


class AuthScheme(BaseModel):
    """Authentication scheme information"""

    type: AuthSchemeType
    fields: AuthSchemeFields | None = None


class ToolkitInfo(BaseModel):
    """Toolkit (App) information"""

    slug: str = Field(..., description="Unique toolkit identifier")
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Toolkit description")
    logo_url: str | None = Field(None, description="Logo URL")
    categories: list[str] = Field(default_factory=list)
    auth_schemes: list[AuthScheme] = Field(default_factory=list)


class ToolParameter(BaseModel):
    """Tool parameter definition"""

    type: str = Field(..., description="Parameter type (string, number, object, etc.)")
    description: str | None = Field(None, description="Parameter description")
    required: bool = Field(False, description="Whether parameter is required")
    default: Any | None = Field(None, description="Default value")
    examples: list[Any] = Field(default_factory=list)
    properties: dict[str, "ToolParameter"] | None = Field(
        None, description="Nested properties for object types"
    )
    items: "ToolParameter | None" = Field(None, description="Array item schema")


class ToolSchema(BaseModel):
    """Tool input/output schema"""

    type: str = Field(default="object")
    properties: dict[str, ToolParameter] = Field(default_factory=dict)
    required: list[str] = Field(default_factory=list)


class ToolDefinition(BaseModel):
    """Raw tool definition with complete metadata"""

    name: str = Field(..., description="Tool display name")
    slug: str = Field(..., description="Tool slug/identifier")
    description: str = Field(..., description="Tool description")
    input_parameters: ToolSchema = Field(
        default_factory=ToolSchema, description="Input parameter schema"
    )
    output_parameters: ToolSchema = Field(
        default_factory=ToolSchema, description="Output parameter schema"
    )
    scopes: list[str] = Field(
        default_factory=list, description="Required OAuth scopes"
    )
    no_auth: bool = Field(False, description="Whether authentication is required")
    version: str | None = Field(None, description="Tool version")


class ConnectionStatus(str, Enum):
    """Connection status enum"""

    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class ConnectionRequest(BaseModel):
    """Request to initiate a connection"""

    toolkit_slug: str = Field(..., description="Toolkit to connect")
    user_id: str = Field(..., description="User ID for the connection")


class ConnectionInitiateResponse(BaseModel):
    """Response from connection initiation"""

    connection_id: str = Field(..., description="Connection ID")
    auth_url: str = Field(..., description="OAuth authorization URL")
    toolkit_slug: str = Field(..., description="Toolkit slug")
    status: ConnectionStatus = Field(..., description="Connection status")


class ConnectionInfo(BaseModel):
    """User connection information"""

    connection_id: str = Field(..., description="Unique connection ID")
    app_type: str = Field(..., description="App/toolkit type")
    status: ConnectionStatus = Field(..., description="Connection status")
    created_at: datetime | None = Field(None, description="Connection creation time")
    updated_at: datetime | None = Field(None, description="Last update time")


class ConnectionStatusResponse(BaseModel):
    """Response for connection status check"""

    connection_id: str = Field(..., description="Connection ID")
    status: ConnectionStatus = Field(..., description="Current status")
    message: str | None = Field(None, description="Status message")


class ToolExecutionRequest(BaseModel):
    """Request to execute a tool"""

    tool_slug: str = Field(..., description="Tool slug to execute")
    user_id: str = Field(..., description="User ID")
    parameters: dict[str, Any] = Field(..., description="Tool parameters")


class ToolExecutionResponse(BaseModel):
    """Response from tool execution"""

    success: bool = Field(..., description="Whether execution was successful")
    result: Any | None = Field(None, description="Execution result")
    error: str | None = Field(None, description="Error message if failed")
    tool_slug: str = Field(..., description="Executed tool slug")


class ToolkitListResponse(BaseModel):
    """Response containing list of toolkits"""

    success: bool = True
    data: list[ToolkitInfo]
    message: str = "Toolkits retrieved successfully"


class ToolDefinitionListResponse(BaseModel):
    """Response containing list of tool definitions"""

    success: bool = True
    data: list[ToolDefinition]
    message: str = "Tool definitions retrieved successfully"


class ConnectionListResponse(BaseModel):
    """Response containing list of user connections"""

    success: bool = True
    data: list[ConnectionInfo]
    message: str = "Connections retrieved successfully"


# Update forward references for recursive models
ToolParameter.model_rebuild()
