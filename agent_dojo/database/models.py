"""Database models for Agent Dojo"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from agent_dojo.database.connection import Base


class User(Base):
    """User model"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    agents = relationship("Agent", back_populates="owner")
    workflows = relationship("Workflow", back_populates="owner")


class Agent(Base):
    """Agent model"""

    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    goal = Column(Text)
    backstory = Column(Text)
    config = Column(JSON)
    status = Column(String(50), default="idle")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)

    # Foreign keys
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="agents")
    executions = relationship("TaskExecution", back_populates="agent")


class Workflow(Base):
    """Workflow model"""

    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(String(20), default="1.0.0")
    definition = Column(JSON)  # Store nodes and edges
    variables = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign keys
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="workflows")
    executions = relationship("WorkflowExecution", back_populates="workflow")


class WorkflowExecution(Base):
    """Workflow execution model"""

    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    status = Column(String(50), default="running")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    error_message = Column(Text)
    input_data = Column(JSON)
    output_data = Column(JSON)
    state_data = Column(JSON)
    execution_time = Column(Float)

    # Foreign keys
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")


class TaskExecution(Base):
    """Task execution model"""

    __tablename__ = "task_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task = Column(Text, nullable=False)
    result = Column(JSON)
    success = Column(Boolean)
    error_message = Column(Text)
    execution_time = Column(Float)
    tokens_used = Column(Integer)
    cost = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign keys
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    workflow_execution_id = Column(
        UUID(as_uuid=True), ForeignKey("workflow_executions.id")
    )

    # Relationships
    agent = relationship("Agent", back_populates="executions")


class CanvasState(Base):
    """Canvas state model for visual workflow editor"""

    __tablename__ = "canvas_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255))
    description = Column(Text)
    canvas_data = Column(JSON)  # Store nodes, edges, viewport
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign keys
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))


class Integration(Base):
    """Integration/Connection model for external apps"""

    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    app_type = Column(String(100), nullable=False)
    connection_id = Column(String(255), unique=True)
    status = Column(String(50), default="pending")
    auth_data = Column(JSON)  # Store encrypted auth tokens
    integration_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class Tool(Base):
    """Tool model"""

    __tablename__ = "tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    category = Column(String(100))
    version = Column(String(20), default="1.0.0")
    config = Column(JSON)
    parameters_schema = Column(JSON)
    required_permissions = Column(JSON)
    is_active = Column(Boolean, default=True)
    is_builtin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ToolExecution(Base):
    """Tool execution log"""

    __tablename__ = "tool_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    tool_name = Column(String(255), nullable=False)
    parameters = Column(JSON)
    result = Column(JSON)
    success = Column(Boolean)
    error_message = Column(Text)
    execution_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"))
    task_execution_id = Column(UUID(as_uuid=True), ForeignKey("task_executions.id"))
