"""Composio integration for app connections and authentication (SDK v3)"""

from enum import Enum
from typing import Any

from composio import Composio

from agent_dojo.core.config import settings
from agent_dojo.core.exceptions import AgentDojoException


class AppType(str, Enum):
    """Supported app types via Composio"""

    GMAIL = "gmail"
    SLACK = "slack"
    GITHUB = "github"
    NOTION = "notion"
    GOOGLE_DRIVE = "googledrive"
    GOOGLE_CALENDAR = "googlecalendar"
    TRELLO = "trello"
    ASANA = "asana"
    DISCORD = "discord"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    ZOOM = "zoom"
    DROPBOX = "dropbox"


class ComposioManager:
    """Manages Composio app integrations and authentication (SDK v3)"""

    def __init__(self):
        if not settings.COMPOSIO_API_KEY:
            raise AgentDojoException("Composio API key not configured")

        # V3: Single unified client (no separate toolset)
        self.client = Composio(api_key=settings.COMPOSIO_API_KEY)
        self.connected_apps: dict[str, dict[str, Any]] = {}

    def get_available_apps(self) -> list[dict[str, Any]]:
        """Get list of available apps/toolkits"""
        try:
            # Return predefined list of supported apps from AppType enum
            # In Composio v3, these represent the available toolkits
            available_apps = []

            for app_type in AppType:
                available_apps.append(
                    {
                        "name": app_type.value.replace("_", " ").title(),
                        "app_id": app_type.value,
                        "description": f"{app_type.value.replace('_', ' ').title()} integration via Composio",
                        "logo": "",
                        "categories": [],
                        "auth_schemes": ["oauth2"],
                    }
                )

            return available_apps
        except Exception as e:
            raise AgentDojoException(f"Failed to get available apps: {str(e)}")

    def initiate_connection(self, app_type: AppType, user_id: str) -> dict[str, Any]:
        """Initiate connection for an app using Composio SDK v3"""
        try:
            # First, get or create auth config for this app
            auth_config = self._get_or_create_auth_config(app_type.value)

            # Create connection request using connected_accounts.initiate()
            connection_request = self.client.connected_accounts.initiate(
                user_id=user_id,
                auth_config_id=auth_config.id,
            )

            return {
                "connection_id": connection_request.id,
                "auth_url": connection_request.redirect_url,
                "app_type": app_type.value,
                "status": connection_request.status,
            }

        except Exception as e:
            raise AgentDojoException(
                f"Failed to initiate connection for {app_type.value}: {str(e)}"
            )

    def _get_or_create_auth_config(self, app_name: str) -> Any:
        """Get existing or create new auth config for an app"""
        try:
            # List existing auth configs for this app
            auth_configs = self.client.auth_configs.list()

            # Find existing config for this app
            configs_list = (
                auth_configs.items if hasattr(auth_configs, "items") else auth_configs
            )
            for config in configs_list:
                # Handle both object and tuple responses
                if isinstance(config, tuple):
                    continue  # Skip tuple entries
                if (
                    hasattr(config, "app_name")
                    and getattr(config, "app_name", "").upper() == app_name.upper()
                ):
                    return config

            # Create new auth config using Composio managed auth
            auth_config = self.client.auth_configs.create(
                app_name,
                options={
                    "type": "use_composio_managed_auth",
                },
            )
            return auth_config

        except Exception as e:
            raise AgentDojoException(f"Failed to get/create auth config: {str(e)}")

    def verify_connection(self, connection_id: str) -> dict[str, Any]:
        """Verify and finalize connection"""
        try:
            # Get connected account by ID
            connected_account = self.client.connected_accounts.get(connection_id)

            status = connected_account.status
            if status == "ACTIVE":
                # Store connection info
                self.connected_apps[connection_id] = {
                    "app_type": connected_account.toolkit.slug
                    if hasattr(connected_account, "toolkit")
                    else None,
                    "user_id": getattr(connected_account, "user_id", None),
                    "status": status,
                    "created_at": getattr(connected_account, "created_at", None),
                    "connection_id": connection_id,
                }

                return {
                    "status": "connected",
                    "connection_id": connection_id,
                    "app_type": connected_account.toolkit.slug
                    if hasattr(connected_account, "toolkit")
                    else None,
                }
            else:
                return {
                    "status": "pending",
                    "connection_id": connection_id,
                }

        except Exception as e:
            raise AgentDojoException(f"Failed to verify connection: {str(e)}")

    def get_connected_apps(self, user_id: str) -> list[dict[str, Any]]:
        """Get user's connected apps"""
        try:
            # List connections for user
            response = self.client.connected_accounts.list(user_ids=[user_id])
            connections = response.items if hasattr(response, "items") else response

            result = []
            for conn in connections:
                # Handle tuple responses (connection_id, status) or object responses
                if isinstance(conn, tuple):
                    connection_id, status = conn[0], conn[1]
                    if status == "ACTIVE":
                        result.append(
                            {
                                "connection_id": connection_id,
                                "app_type": None,
                                "status": status,
                                "created_at": None,
                            }
                        )
                else:
                    # Handle object response
                    conn_status = getattr(conn, "status", None)
                    if conn_status == "ACTIVE":
                        result.append(
                            {
                                "connection_id": getattr(conn, "id", None),
                                "app_type": (
                                    getattr(conn.toolkit, "slug", None)
                                    if hasattr(conn, "toolkit") and conn.toolkit
                                    else None
                                ),
                                "status": conn_status,
                                "created_at": getattr(conn, "created_at", None),
                            }
                        )
            return result
        except Exception as e:
            raise AgentDojoException(
                f"Failed to get connected apps for user {user_id}: {str(e)}"
            )

    def disconnect_app(self, connection_id: str) -> bool:
        """Disconnect an app (v3)"""
        try:
            # V3: Delete connection
            self.client.connected_accounts.delete(connection_id)

            if connection_id in self.connected_apps:
                del self.connected_apps[connection_id]

            return True

        except Exception as e:
            raise AgentDojoException(
                f"Failed to disconnect app {connection_id}: {str(e)}"
            )

    def get_tools_for_app(self, app_type: AppType, user_id: str) -> list[Any]:
        """Get available tools for a toolkit and user (v3: uses user_id not connection_id)"""
        try:
            # V3: Get tools with user_id and toolkit
            tools = self.client.tools.get(user_id=user_id, toolkits=[app_type.value])

            return tools

        except Exception as e:
            raise AgentDojoException(
                f"Failed to get tools for app {app_type.value}: {str(e)}"
            )

    def execute_tool(
        self, tool_slug: str, user_id: str, parameters: dict[str, Any]
    ) -> dict[str, Any]:
        """Execute a tool action (v3: uses tool_slug string and user_id)"""
        try:
            # V3: Execute tool by slug
            result = self.client.tools.execute(
                slug=tool_slug, user_id=user_id, arguments=parameters
            )

            return {
                "success": result.get("successful", True),
                "result": result.get("data", result),
                "error": result.get("error"),
                "tool": tool_slug,
                "user_id": user_id,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "result": None,
                "tool": tool_slug,
                "user_id": user_id,
            }

    def get_toolkit_tools(
        self, app_type: AppType, user_id: str
    ) -> list[dict[str, Any]]:
        """Get available tools/actions for a toolkit (v3: renamed from get_app_actions)"""
        try:
            # V3: Get tools for toolkit
            tools = self.client.tools.get(user_id=user_id, toolkits=[app_type.value])

            return [
                {
                    "name": tool.name,
                    "slug": tool.slug,
                    "description": tool.description,
                    "parameters": tool.input_parameters
                    if hasattr(tool, "input_parameters")
                    else {},
                }
                for tool in tools
            ]

        except Exception as e:
            raise AgentDojoException(
                f"Failed to get tools for app {app_type.value}: {str(e)}"
            )


# Global Composio manager instance
composio_manager: ComposioManager | None = None


def init_composio() -> None:
    """Initialize Composio manager"""
    global composio_manager

    if not settings.COMPOSIO_API_KEY:
        print("Composio API key not provided, app integrations disabled")
        return

    try:
        composio_manager = ComposioManager()
        print("Composio integration initialized")

    except Exception as e:
        print(f"Failed to initialize Composio: {e}")
        composio_manager = None


def get_composio_manager() -> ComposioManager | None:
    """Get Composio manager instance"""
    return composio_manager
