"""Base agent implementation inspired by CrewAI"""

import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any

from langchain_core.language_models import BaseLanguageModel
from langchain_core.messages import BaseMessage
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from agent_dojo.core.exceptions import AgentException
from agent_dojo.observability.langfuse_client import langfuse_client


class AgentRole(str, Enum):
    """Predefined agent roles"""

    RESEARCHER = "researcher"
    WRITER = "writer"
    ANALYST = "analyst"
    COORDINATOR = "coordinator"
    EXECUTOR = "executor"
    REVIEWER = "reviewer"
    CUSTOM = "custom"


class AgentStatus(str, Enum):
    """Agent execution status"""

    IDLE = "idle"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class AgentConfig(BaseModel):
    """Agent configuration"""

    role: AgentRole
    goal: str
    backstory: str
    max_execution_time: int = Field(
        default=300, description="Maximum execution time in seconds"
    )
    max_iter: int = Field(default=10, description="Maximum number of iterations")
    memory_enabled: bool = Field(default=True)
    verbose: bool = Field(default=False)
    allow_delegation: bool = Field(default=False)
    system_template: str | None = Field(default=None)
    tools: list[str] = Field(default_factory=list, description="List of tool names")


class AgentMemory(BaseModel):
    """Agent memory storage"""

    short_term: list[BaseMessage] = Field(default_factory=list)
    long_term: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)


class TaskResult(BaseModel):
    """Result of agent task execution"""

    success: bool
    result: Any
    error: str | None = None
    execution_time: float
    tokens_used: int | None = None
    cost: float | None = None


class BaseAgent(ABC):
    """Base agent class inspired by CrewAI architecture"""

    def __init__(
        self,
        config: AgentConfig,
        llm: BaseLanguageModel,
        tools: list[BaseTool] | None = None,
        agent_id: str | None = None,
    ):
        self.id = agent_id or str(uuid.uuid4())
        self.config = config
        self.llm = llm
        self.tools = tools or []
        self.memory = AgentMemory()
        self.status = AgentStatus.IDLE
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()

        # Langfuse tracing
        self.trace = None

    @property
    def role(self) -> AgentRole:
        """Get agent role"""
        return self.config.role

    @property
    def goal(self) -> str:
        """Get agent goal"""
        return self.config.goal

    @property
    def backstory(self) -> str:
        """Get agent backstory"""
        return self.config.backstory

    def add_tool(self, tool: BaseTool) -> None:
        """Add a tool to the agent"""
        if tool not in self.tools:
            self.tools.append(tool)

    def remove_tool(self, tool_name: str) -> None:
        """Remove a tool from the agent"""
        self.tools = [tool for tool in self.tools if tool.name != tool_name]

    def update_memory(self, key: str, value: Any, memory_type: str = "context") -> None:
        """Update agent memory"""
        if memory_type == "context":
            self.memory.context[key] = value
        elif memory_type == "long_term":
            self.memory.long_term[key] = value

        self.last_activity = datetime.utcnow()

    def get_memory(self, key: str, memory_type: str = "context") -> Any:
        """Get value from agent memory"""
        if memory_type == "context":
            return self.memory.context.get(key)
        elif memory_type == "long_term":
            return self.memory.long_term.get(key)
        return None

    def add_message(self, message: BaseMessage) -> None:
        """Add message to short-term memory"""
        self.memory.short_term.append(message)

        # Keep only last 20 messages to prevent memory overflow
        if len(self.memory.short_term) > 20:
            self.memory.short_term = self.memory.short_term[-20:]

        self.last_activity = datetime.utcnow()

    def get_context_prompt(self) -> str:
        """Build context prompt for the agent"""
        prompt_parts = [
            f"You are a {self.role.value} agent.",
            f"Your role: {self.role.value}",
            f"Your goal: {self.goal}",
            f"Your backstory: {self.backstory}",
        ]

        if self.tools:
            tools_desc = "\n".join(
                [f"- {tool.name}: {tool.description}" for tool in self.tools]
            )
            prompt_parts.append(f"Available tools:\n{tools_desc}")

        if self.memory.context:
            context_items = "\n".join(
                [f"- {k}: {v}" for k, v in self.memory.context.items()]
            )
            prompt_parts.append(f"Context:\n{context_items}")

        return "\n\n".join(prompt_parts)

    @abstractmethod
    async def execute_task(self, task: str, **kwargs) -> TaskResult:
        """Execute a task - to be implemented by specific agent types"""
        pass

    async def delegate_task(self, task: str, target_agent: "BaseAgent") -> TaskResult:
        """Delegate a task to another agent"""
        if not self.config.allow_delegation:
            raise AgentException("Agent is not configured to allow delegation")

        return await target_agent.execute_task(task)

    def start_trace(self, task_name: str) -> None:
        """Start Langfuse tracing for task"""
        if langfuse_client:
            self.trace = langfuse_client.trace(
                name=f"{self.role.value}_agent_{task_name}",
                metadata={
                    "agent_id": self.id,
                    "agent_role": self.role.value,
                    "agent_goal": self.goal,
                },
            )

    def end_trace(self, result: TaskResult) -> None:
        """End Langfuse tracing"""
        if self.trace:
            self.trace.update(
                output={"success": result.success, "result": str(result.result)},
                metadata={
                    "execution_time": result.execution_time,
                    "tokens_used": result.tokens_used,
                    "cost": result.cost,
                },
            )

    def to_dict(self) -> dict[str, Any]:
        """Convert agent to dictionary"""
        return {
            "id": self.id,
            "role": self.config.role.value,
            "goal": self.config.goal,
            "backstory": self.config.backstory,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "tools": [tool.name for tool in self.tools],
            "memory_size": len(self.memory.short_term),
        }

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id}, role={self.role.value})>"
