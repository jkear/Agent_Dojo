"""LangGraph workflow manager for visual workflow execution"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Any, TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from agent_dojo.agents.base_agent import BaseAgent
from agent_dojo.core.exceptions import WorkflowException
from agent_dojo.observability.langfuse_client import langfuse_client


class WorkflowStatus(str, Enum):
    """Workflow execution status"""

    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NodeType(str, Enum):
    """Types of workflow nodes"""

    AGENT = "agent"
    TOOL = "tool"
    CONDITION = "condition"
    START = "start"
    END = "end"
    PARALLEL = "parallel"
    WAIT = "wait"


class WorkflowNode(BaseModel):
    """Individual node in workflow"""

    id: str
    type: NodeType
    name: str
    config: dict[str, Any] = Field(default_factory=dict)
    position: dict[str, float] = Field(default_factory=dict)  # x, y coordinates
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)


class WorkflowEdge(BaseModel):
    """Edge connecting workflow nodes"""

    id: str
    source_node_id: str
    target_node_id: str
    condition: str | None = None  # Conditional logic
    label: str | None = None


class WorkflowDefinition(BaseModel):
    """Complete workflow definition"""

    id: str
    name: str
    description: str
    version: str = "1.0.0"
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)
    variables: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowState(TypedDict):
    """State passed between workflow nodes"""

    execution_id: str
    current_node: str
    variables: dict[str, Any]
    results: dict[str, Any]
    errors: list[str]
    agent_outputs: dict[str, Any]


class WorkflowExecution(BaseModel):
    """Workflow execution instance"""

    id: str
    workflow_id: str
    status: WorkflowStatus
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None
    state: dict[str, Any] | None = None
    results: dict[str, Any] = Field(default_factory=dict)


class WorkflowManager:
    """Manages workflow creation and execution using LangGraph"""

    def __init__(self):
        self.workflows: dict[str, WorkflowDefinition] = {}
        self.executions: dict[str, WorkflowExecution] = {}
        self.agents: dict[str, BaseAgent] = {}

    def register_agent(self, agent: BaseAgent) -> None:
        """Register an agent for use in workflows"""
        self.agents[agent.id] = agent

    def create_workflow(
        self,
        name: str,
        description: str,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
    ) -> WorkflowDefinition:
        """Create a new workflow definition"""

        workflow_id = str(uuid.uuid4())

        # Convert dict nodes to WorkflowNode objects
        workflow_nodes = [WorkflowNode(**node) for node in nodes]

        # Convert dict edges to WorkflowEdge objects
        workflow_edges = [WorkflowEdge(**edge) for edge in edges]

        workflow = WorkflowDefinition(
            id=workflow_id,
            name=name,
            description=description,
            nodes=workflow_nodes,
            edges=workflow_edges,
        )

        # Validate workflow structure
        self._validate_workflow(workflow)

        self.workflows[workflow_id] = workflow
        return workflow

    def _validate_workflow(self, workflow: WorkflowDefinition) -> None:
        """Validate workflow structure"""
        node_ids = {node.id for node in workflow.nodes}

        # Check for start and end nodes
        start_nodes = [n for n in workflow.nodes if n.type == NodeType.START]
        end_nodes = [n for n in workflow.nodes if n.type == NodeType.END]

        if not start_nodes:
            raise WorkflowException("Workflow must have at least one START node")
        if not end_nodes:
            raise WorkflowException("Workflow must have at least one END node")

        # Validate edge connections
        for edge in workflow.edges:
            if edge.source_node_id not in node_ids:
                raise WorkflowException(
                    f"Edge source node {edge.source_node_id} not found"
                )
            if edge.target_node_id not in node_ids:
                raise WorkflowException(
                    f"Edge target node {edge.target_node_id} not found"
                )

    async def execute_workflow(
        self, workflow_id: str, initial_variables: dict[str, Any] | None = None
    ) -> WorkflowExecution:
        """Execute a workflow using LangGraph"""

        if workflow_id not in self.workflows:
            raise WorkflowException(f"Workflow {workflow_id} not found")

        workflow = self.workflows[workflow_id]
        execution_id = str(uuid.uuid4())

        # Create execution record
        execution = WorkflowExecution(
            id=execution_id,
            workflow_id=workflow_id,
            status=WorkflowStatus.RUNNING,
            started_at=datetime.utcnow(),
        )

        self.executions[execution_id] = execution

        try:
            # Build LangGraph
            graph = self._build_langgraph(workflow, execution_id)

            # Initialize state
            initial_state: WorkflowState = {
                "execution_id": execution_id,
                "current_node": "start",
                "variables": initial_variables or {},
                "results": {},
                "errors": [],
                "agent_outputs": {},
            }

            # Start Langfuse tracing
            trace = None
            if langfuse_client:
                trace = langfuse_client.trace(
                    name=f"workflow_{workflow.name}",
                    metadata={
                        "workflow_id": workflow_id,
                        "execution_id": execution_id,
                    },
                )

            # Execute workflow
            final_state = await graph.ainvoke(initial_state)

            # Update execution
            execution.status = WorkflowStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            execution.state = final_state
            execution.results = final_state.get("results", {})

            # End tracing
            if trace:
                trace.update(
                    output=execution.results,
                    metadata={
                        "status": execution.status,
                        "duration": (
                            execution.completed_at execution.started_at
                            ).total_seconds(),
                    },
                )

        except Exception as e:
            execution.status = WorkflowStatus.FAILED
            execution.completed_at = datetime.utcnow()
            execution.error = str(e)

            if trace:
                trace.update(output={"error": str(e)}, metadata={"status": "failed"})

        return execution

    def _build_langgraph(
        self, workflow: WorkflowDefinition, execution_id: str
    ) -> StateGraph:
        """Build LangGraph from workflow definition"""

        # Create state graph
        graph = StateGraph(WorkflowState)

        # Add nodes
        for node in workflow.nodes:
            if node.type == NodeType.START:
                graph.add_node(node.id, self._create_start_node(node))
            elif node.type == NodeType.END:
                graph.add_node(node.id, self._create_end_node(node))
            elif node.type == NodeType.AGENT:
                graph.add_node(node.id, self._create_agent_node(node))
            elif node.type == NodeType.TOOL:
                graph.add_node(node.id, self._create_tool_node(node))
            elif node.type == NodeType.CONDITION:
                graph.add_node(node.id, self._create_condition_node(node))
            elif node.type == NodeType.PARALLEL:
                graph.add_node(node.id, self._create_parallel_node(node))

        # Add edges
        for edge in workflow.edges:
            if edge.condition:
                # Conditional edge
                graph.add_conditional_edges(
                    edge.source_node_id,
                    self._create_condition_function(edge.condition),
                    {True: edge.target_node_id, False: END},
                )
            else:
                # Regular edge
                graph.add_edge(edge.source_node_id, edge.target_node_id)

        # Set entry point
        start_nodes = [n for n in workflow.nodes if n.type == NodeType.START]
        if start_nodes:
            graph.set_entry_point(start_nodes[0].id)

        # Add memory saver for checkpointing
        memory = MemorySaver()
        graph = graph.compile(checkpointer=memory)

        return graph

    def _create_start_node(self, node: WorkflowNode):
        """Create start node function"""

        async def start_node(state: WorkflowState) -> WorkflowState:
            state["current_node"] = node.id
            return state

        return start_node

    def _create_end_node(self, node: WorkflowNode):
        """Create end node function"""

        async def end_node(state: WorkflowState) -> WorkflowState:
            state["current_node"] = node.id
            return state

        return end_node

    def _create_agent_node(self, node: WorkflowNode):
        """Create agent execution node"""

        async def agent_node(state: WorkflowState) -> WorkflowState:
            try:
                agent_id = node.config.get("agent_id")
                task = node.config.get("task", "")

                if agent_id not in self.agents:
                    state["errors"].append(f"Agent {agent_id} not found")
                    return state

                agent = self.agents[agent_id]

                # Execute task with agent
                result = await agent.execute_task(task)

                # Store result
                state["agent_outputs"][node.id] = result.model_dump()
                state["results"][node.id] = result.result
                state["current_node"] = node.id

            except Exception as e:
                state["errors"].append(f"Agent node {node.id} failed: {str(e)}")

            return state

        return agent_node

    def _create_tool_node(self, node: WorkflowNode):
        """Create tool execution node"""

        async def tool_node(state: WorkflowState) -> WorkflowState:
            try:
                tool_name = node.config.get("tool_name")
                # tool_input = node.config.get("input", {})  # TODO: Use in implementation

                # TODO: Implement tool execution
                # This would integrate with the MCP tool system

                state["results"][node.id] = f"Tool {tool_name} executed"
                state["current_node"] = node.id

            except Exception as e:
                state["errors"].append(f"Tool node {node.id} failed: {str(e)}")

            return state

        return tool_node

    def _create_condition_node(self, node: WorkflowNode):
        """Create conditional logic node"""

        async def condition_node(state: WorkflowState) -> WorkflowState:
            try:
                # condition = node.config.get("condition", "True")  # TODO: Use in safe evaluation
                # Evaluate condition against state
                # TODO: Implement safe condition evaluation

                state["current_node"] = node.id

            except Exception as e:
                state["errors"].append(f"Condition node {node.id} failed: {str(e)}")

            return state

        return condition_node

    def _create_parallel_node(self, node: WorkflowNode):
        """Create parallel execution node"""

        async def parallel_node(state: WorkflowState) -> WorkflowState:
            try:
                # TODO: Implement parallel execution
                state["current_node"] = node.id

            except Exception as e:
                state["errors"].append(f"Parallel node {node.id} failed: {str(e)}")

            return state

        return parallel_node

    def _create_condition_function(self, condition: str):
        """Create condition evaluation function"""

        def condition_func(_state: WorkflowState) -> bool:
            # TODO: Implement safe condition evaluation
            return True

        return condition_func

    def get_workflow(self, workflow_id: str) -> WorkflowDefinition | None:
        """Get workflow by ID"""
        return self.workflows.get(workflow_id)

    def get_execution(self, execution_id: str) -> WorkflowExecution | None:
        """Get execution by ID"""
        return self.executions.get(execution_id)

    def list_workflows(self) -> list[WorkflowDefinition]:
        """List all workflows"""
        return list(self.workflows.values())

    def list_executions(
        self, workflow_id: str | None = None
    ) -> list[WorkflowExecution]:
        """List executions, optionally filtered by workflow"""
        executions = list(self.executions.values())
        if workflow_id:
            executions = [e for e in executions if e.workflow_id == workflow_id]
        return executions

    def delete_workflow(self, workflow_id: str) -> bool:
        """Delete workflow"""
        if workflow_id in self.workflows:
            del self.workflows[workflow_id]
            return True
        return False
