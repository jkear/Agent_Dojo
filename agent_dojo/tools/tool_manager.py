"""MCP Tool manager and integration"""

from abc import abstractmethod
from enum import Enum
from typing import Any

from langchain_core.tools import BaseTool
from pydantic import BaseModel, ConfigDict, Field, PrivateAttr

from agent_dojo.core.exceptions import ToolException


class ToolCategory(str, Enum):
    """Tool categories"""

    COMMUNICATION = "communication"
    DATA_PROCESSING = "data_processing"
    FILE_OPERATIONS = "file_operations"
    WEB_SCRAPING = "web_scraping"
    API_INTEGRATION = "api_integration"
    DATABASE = "database"
    ANALYTICS = "analytics"
    CUSTOM = "custom"


class ToolStatus(str, Enum):
    """Tool availability status"""

    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DEPRECATED = "deprecated"
    MAINTENANCE = "maintenance"


class MCPToolConfig(BaseModel):
    """MCP Tool configuration"""

    name: str
    description: str
    category: ToolCategory
    version: str = "1.0.0"
    parameters_schema: dict[str, Any] = Field(default_factory=dict)
    required_permissions: list[str] = Field(default_factory=list)
    configuration: dict[str, Any] = Field(default_factory=dict)


class MCPTool(BaseTool):
    """Base MCP Tool implementation"""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    name: str
    description: str
    status: ToolStatus = ToolStatus.AVAILABLE
    _config: MCPToolConfig = PrivateAttr()

    def __init__(self, config: MCPToolConfig, **kwargs):
        super().__init__(name=config.name, description=config.description, **kwargs)
        # Store config after BaseTool (Pydantic) initialization to avoid attribute errors
        self._config = config

    @property
    def config(self) -> MCPToolConfig:
        return self._config

    @abstractmethod
    def _run(self, *args, **kwargs) -> Any:
        """Execute the tool synchronously"""
        pass

    @abstractmethod
    async def _arun(self, *args, **kwargs) -> Any:
        """Execute the tool asynchronously"""
        pass

    def validate_parameters(self, parameters: dict[str, Any]) -> bool:
        """Validate tool parameters against schema"""
        # TODO: Implement JSON schema validation
        return True

    def check_permissions(self, user_permissions: list[str]) -> bool:
        """Check if user has required permissions"""
        return all(
            perm in user_permissions for perm in self.config.required_permissions
        )


class FileOperationsTool(MCPTool):
    """File operations MCP tool"""

    def __init__(self):
        config = MCPToolConfig(
            name="file_operations",
            description="Read, write, and manipulate files",
            category=ToolCategory.FILE_OPERATIONS,
            parameters_schema={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["read", "write", "delete", "list"],
                    },
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["operation", "path"],
            },
            required_permissions=["file_system_access"],
        )
        super().__init__(config)

    def _run(self, operation: str, path: str, content: str | None = None) -> Any:
        """Execute file operation"""
        if operation == "read":
            try:
                with open(path, encoding="utf-8") as f:
                    return f.read()
            except Exception as e:
                raise ToolException(f"Failed to read file {path}: {str(e)}")

        elif operation == "write":
            if content is None:
                raise ToolException("Content is required for write operation")
            try:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                return f"Successfully wrote to {path}"
            except Exception as e:
                raise ToolException(f"Failed to write file {path}: {str(e)}")

        elif operation == "delete":
            try:
                import os

                os.remove(path)
                return f"Successfully deleted {path}"
            except Exception as e:
                raise ToolException(f"Failed to delete file {path}: {str(e)}")

        elif operation == "list":
            try:
                import os

                return os.listdir(path)
            except Exception as e:
                raise ToolException(f"Failed to list directory {path}: {str(e)}")

        else:
            raise ToolException(f"Unknown operation: {operation}")

    async def _arun(
        self, operation: str, path: str, content: str | None = None
    ) -> Any:
        """Execute file operation asynchronously"""
        import asyncio

        return await asyncio.to_thread(self._run, operation, path, content)


class WebScrapingTool(MCPTool):
    """Web scraping MCP tool"""

    def __init__(self):
        config = MCPToolConfig(
            name="web_scraping",
            description="Scrape content from web pages",
            category=ToolCategory.WEB_SCRAPING,
            parameters_schema={
                "type": "object",
                "properties": {
                    "url": {"type": "string"},
                    "selector": {"type": "string"},
                    "headers": {"type": "object"},
                },
                "required": ["url"],
            },
            required_permissions=["internet_access"],
        )
        super().__init__(config)

    def _run(
        self, url: str, selector: str | None = None, headers: dict | None = None
    ) -> Any:
        """Scrape web content"""
        try:
            import requests
            from bs4 import BeautifulSoup

            response = requests.get(url, headers=headers or {})
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            if selector:
                elements = soup.select(selector)
                return [el.get_text().strip() for el in elements]
            else:
                return soup.get_text().strip()

        except Exception as e:
            raise ToolException(f"Failed to scrape {url}: {str(e)}")

    async def _arun(
        self, url: str, selector: str | None = None, headers: dict | None = None
    ) -> Any:
        """Scrape web content asynchronously"""
        try:
            import aiohttp
            from bs4 import BeautifulSoup

            async with (
                aiohttp.ClientSession() as session,
                session.get(url, headers=headers or {}) as response,
            ):
                response.raise_for_status()
                text = await response.text()

                soup = BeautifulSoup(text, "html.parser")

                if selector:
                    elements = soup.select(selector)
                    return [el.get_text().strip() for el in elements]
                else:
                    return soup.get_text().strip()

        except Exception as e:
            raise ToolException(f"Failed to scrape {url}: {str(e)}")


class DatabaseTool(MCPTool):
    """Database operations MCP tool"""

    def __init__(self):
        config = MCPToolConfig(
            name="database",
            description="Execute database queries",
            category=ToolCategory.DATABASE,
            parameters_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "parameters": {"type": "object"},
                    "connection_string": {"type": "string"},
                },
                "required": ["query"],
            },
            required_permissions=["database_access"],
        )
        super().__init__(config)

    def _run(
        self,
        query: str,
        parameters: dict | None = None,
        connection_string: str | None = None,
    ) -> Any:
        """Execute database query"""
        try:
            import sqlite3  # Simple example with SQLite

            # In production, this would connect to the configured database
            conn = sqlite3.connect(":memory:")  # Example
            cursor = conn.cursor()

            cursor.execute(query, parameters or {})

            if query.strip().lower().startswith("select"):
                result = cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                return [dict(zip(columns, row, strict=False)) for row in result]
            else:
                conn.commit()
                return {"affected_rows": cursor.rowcount}

        except Exception as e:
            raise ToolException(f"Database query failed: {str(e)}")

    async def _arun(
        self,
        query: str,
        parameters: dict | None = None,
        connection_string: str | None = None,
    ) -> Any:
        """Execute database query asynchronously"""
        import asyncio

        return await asyncio.to_thread(self._run, query, parameters, connection_string)


class ToolManager:
    """Manages MCP tools and their execution"""

    def __init__(self):
        self.tools: dict[str, MCPTool] = {}
        self.tool_configs: dict[str, MCPToolConfig] = {}

        # Register default tools
        self._register_default_tools()

    def _register_default_tools(self):
        """Register default MCP tools"""
        default_tools = [
            FileOperationsTool(),
            WebScrapingTool(),
            DatabaseTool(),
        ]

        for tool in default_tools:
            self.register_tool(tool)

    def register_tool(self, tool: MCPTool) -> None:
        """Register a new MCP tool"""
        self.tools[tool.name] = tool
        self.tool_configs[tool.name] = tool.config

    def unregister_tool(self, tool_name: str) -> bool:
        """Unregister a tool"""
        if tool_name in self.tools:
            del self.tools[tool_name]
            del self.tool_configs[tool_name]
            return True
        return False

    def get_tool(self, tool_name: str) -> MCPTool | None:
        """Get tool by name"""
        return self.tools.get(tool_name)

    def list_tools(self, category: ToolCategory | None = None) -> list[MCPTool]:
        """List available tools, optionally filtered by category"""
        tools = list(self.tools.values())
        if category:
            tools = [tool for tool in tools if tool.config.category == category]
        return tools

    def get_tools_for_agent(
        self, agent_role: str, permissions: list[str]
    ) -> list[MCPTool]:
        """Get tools suitable for a specific agent role"""
        suitable_tools = []

        for tool in self.tools.values():
            if tool.status != ToolStatus.AVAILABLE:
                continue

            # Check permissions
            if not tool.check_permissions(permissions):
                continue

            # TODO: Add role-based tool filtering logic
            suitable_tools.append(tool)

        return suitable_tools

    async def execute_tool(
        self,
        tool_name: str,
        parameters: dict[str, Any],
        user_permissions: list[str] | None = None,
    ) -> Any:
        """Execute a tool with given parameters"""

        tool = self.get_tool(tool_name)
        if not tool:
            raise ToolException(f"Tool {tool_name} not found")

        if tool.status != ToolStatus.AVAILABLE:
            raise ToolException(f"Tool {tool_name} is not available")

        # Validate parameters
        if not tool.validate_parameters(parameters):
            raise ToolException(f"Invalid parameters for tool {tool_name}")

        # Check permissions
        if user_permissions and not tool.check_permissions(user_permissions):
            raise ToolException(f"Insufficient permissions for tool {tool_name}")

        # Execute tool
        return await tool._arun(**parameters)

    def get_tool_schema(self, tool_name: str) -> dict[str, Any] | None:
        """Get tool parameter schema"""
        config = self.tool_configs.get(tool_name)
        return config.parameters_schema if config else None

    def export_tools_config(self) -> dict[str, Any]:
        """Export all tool configurations"""
        return {name: config.model_dump() for name, config in self.tool_configs.items()}

    def import_tools_config(self, config_data: dict[str, Any]) -> None:
        """Import tool configurations"""
        # TODO: Implement dynamic tool loading from configuration
        pass
