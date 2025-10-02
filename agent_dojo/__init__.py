"""Agent Dojo - Modern AI Agent Orchestration Framework"""

__version__ = "0.1.0"
__author__ = "Agent Dojo Contributors"
__description__ = "Modern AI agent orchestration framework with visual workflow builder"

from agent_dojo.agents.base_agent import BaseAgent
from agent_dojo.core.config import settings
from agent_dojo.tools.tool_manager import ToolManager
from agent_dojo.workflows.workflow_manager import WorkflowManager

__all__ = [
    "settings",
    "BaseAgent",
    "WorkflowManager",
    "ToolManager",
]
