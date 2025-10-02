"""Unified tool input schemas for Agent Dojo

This module provides Pydantic-based schemas that work across:
- LangChain (BaseTool args_schema)
- MCP/Smithery (JSON Schema export)
- Composio (native Pydantic support)
- Langfuse (observability metadata)

All tool schemas inherit from ToolInputSchema which provides
multi-format export capabilities and runtime validation.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ToolInputSchema(BaseModel):
    """
    Base class for all tool input schemas.

    Provides:
    - Pydantic v2 validation
    - JSON Schema export for MCP
    - LangChain native compatibility
    - Composio format export
    - OpenAPI 3.0 schema export
    """

    model_config = ConfigDict(
        # Strict validation - no extra fields allowed
        extra="forbid",
        # Strip whitespace from strings
        str_strip_whitespace=True,
        # Don't allow arbitrary types
        arbitrary_types_allowed=False,
        # JSON Schema customization
        json_schema_extra={"additionalProperties": False},
    )

    @classmethod
    def to_mcp_schema(cls) -> dict[str, Any]:
        """
        Export to MCP/Smithery JSON Schema format.

        Returns:
            dict: JSON Schema compatible with MCP protocol
        """
        return cls.model_json_schema()

    @classmethod
    def to_langchain_schema(cls) -> type[BaseModel]:
        """
        Return schema for LangChain BaseTool.args_schema.

        Returns:
            type[BaseModel]: The schema class itself (already compatible)
        """
        return cls

    @classmethod
    def to_composio_schema(cls) -> dict[str, Any]:
        """
        Export to Composio format.

        Returns:
            dict: Schema in Composio-compatible format
        """
        schema = cls.model_json_schema()
        return {
            "type": "object",
            "properties": schema.get("properties", {}),
            "required": schema.get("required", []),
            "description": schema.get("description", cls.__doc__ or ""),
        }

    @classmethod
    def get_openapi_schema(cls) -> dict[str, Any]:
        """
        Export to OpenAPI 3.0 format.

        Returns:
            dict: OpenAPI-compatible schema
        """
        return cls.model_json_schema()


class FileOperationsInput(ToolInputSchema):
    """
    Input schema for file operations tool.

    Supports reading, writing, deleting, and listing files/directories
    with full path validation and encoding support.
    """

    operation: Literal["read", "write", "delete", "list"] = Field(
        description="Operation to perform on the file system"
    )
    path: str = Field(
        description="Absolute or relative path to file or directory",
        min_length=1,
        max_length=4096,
    )
    content: str | None = Field(
        default=None,
        description="Content for write operations (required when operation=write)",
    )
    encoding: str = Field(
        default="utf-8", description="File encoding for read/write operations"
    )

    @field_validator("path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        """Validate path format and prevent path traversal attacks"""
        # Prevent path traversal
        if ".." in v:
            raise ValueError("Path traversal (..) not allowed for security")

        # Prevent null bytes
        if "\x00" in v:
            raise ValueError("Null bytes not allowed in path")

        return v

    @field_validator("content")
    @classmethod
    def validate_content_with_operation(cls, v: str | None, info) -> str | None:
        """Ensure content is provided for write operations"""
        if (
            hasattr(info, "data")
            and info.data.get("operation") == "write"
            and v is None
        ):
            raise ValueError("Content is required when operation=write")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"operation": "read", "path": "/tmp/example.txt", "encoding": "utf-8"},
                {
                    "operation": "write",
                    "path": "/tmp/output.txt",
                    "content": "Hello, World!",
                    "encoding": "utf-8",
                },
                {
                    "operation": "delete",
                    "path": "/tmp/temp_file.txt",
                    "encoding": "utf-8",
                },
                {"operation": "list", "path": "/tmp", "encoding": "utf-8"},
            ]
        }
    )


class WebScrapingInput(ToolInputSchema):
    """
    Input schema for web scraping tool.

    Supports fetching web pages and extracting content using
    CSS selectors with custom headers.
    """

    url: str = Field(
        description="URL to scrape (must start with http:// or https://)",
        pattern=r"^https?://.+",
        min_length=10,
        max_length=2048,
    )
    selector: str | None = Field(
        default=None,
        description="CSS selector to extract specific elements (optional)",
    )
    headers: dict[str, str] | None = Field(
        default=None, description="Custom HTTP headers to send with the request"
    )
    timeout: int = Field(
        default=30, description="Request timeout in seconds", ge=1, le=300
    )

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate URL format"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")

        # Prevent localhost/private IPs in production
        # (this is a simple check, enhance for production)
        if any(x in v.lower() for x in ["localhost", "127.0.0.1", "0.0.0.0"]):
            # You may want to allow this in development
            pass

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"url": "https://example.com", "timeout": 30},
                {
                    "url": "https://news.ycombinator.com",
                    "selector": ".storylink",
                    "timeout": 30,
                },
                {
                    "url": "https://api.example.com/data",
                    "headers": {"Authorization": "Bearer token123"},
                    "timeout": 60,
                },
            ]
        }
    )


class DatabaseInput(ToolInputSchema):
    """
    Input schema for database operations tool.

    Supports executing SQL queries with parameters and
    connection configuration.
    """

    query: str = Field(
        description="SQL query to execute", min_length=1, max_length=10000
    )
    parameters: dict[str, Any] | None = Field(
        default=None,
        description="Query parameters for parameterized queries (prevents SQL injection)",
    )
    connection_string: str | None = Field(
        default=None,
        description="Database connection string (uses default if not provided)",
    )
    timeout: int = Field(
        default=30, description="Query timeout in seconds", ge=1, le=300
    )
    fetch_size: int | None = Field(
        default=None,
        description="Maximum number of rows to fetch (for SELECT queries)",
        ge=1,
        le=10000,
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Basic SQL query validation"""
        query_lower = v.lower().strip()

        # Prevent multiple statements (basic check)
        if ";" in v[:-1]:  # Allow trailing semicolon
            raise ValueError("Multiple SQL statements not allowed")

        # Warn about dangerous operations (don't block, just validate format)
        dangerous_ops = ["drop", "truncate", "delete"]
        if any(query_lower.startswith(op) for op in dangerous_ops):
            # In production, you might want to require special permissions
            pass

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "query": "SELECT * FROM users WHERE id = :user_id",
                    "parameters": {"user_id": 123},
                    "timeout": 30,
                },
                {
                    "query": "INSERT INTO logs (message, timestamp) VALUES (:msg, :ts)",
                    "parameters": {"msg": "Test", "ts": "2024-01-01 00:00:00"},
                    "timeout": 10,
                },
                {
                    "query": "SELECT name, email FROM users LIMIT 100",
                    "fetch_size": 100,
                    "timeout": 30,
                },
            ]
        }
    )


# Export all schemas
__all__ = [
    "ToolInputSchema",
    "FileOperationsInput",
    "WebScrapingInput",
    "DatabaseInput",
]
