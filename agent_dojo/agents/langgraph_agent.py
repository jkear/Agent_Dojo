"""LangGraph-based agent implementation"""

import time
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph

from agent_dojo.agents.base_agent import AgentStatus, BaseAgent, TaskResult
from agent_dojo.observability.langfuse_client import langfuse_handler
from agent_dojo.observability.telemetry import get_tracer


class AgentState(TypedDict):
    """State schema for LangGraph agent"""

    messages: list[Any]
    task: str
    context: dict[str, Any]
    result: Any | None
    error: str | None
    iterations: int
    max_iterations: int


class LangGraphAgent(BaseAgent):
    """LangGraph-powered agent with state management"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tracer = get_tracer("agent")
        self._build_graph()

    def _build_graph(self) -> None:
        """Build the agent's LangGraph state graph"""

        # Create state graph
        workflow = StateGraph(AgentState)

        # Add nodes - pass function references directly
        workflow.add_node("plan", self._plan_node)
        workflow.add_node("execute", self._execute_node)
        workflow.add_node("reflect", self._reflect_node)
        workflow.add_node("finish", self._finish_node)

        # Add edges
        workflow.add_edge("plan", "execute")
        workflow.add_conditional_edges(
            "execute",
            self._should_continue,
            {"continue": "reflect", "finish": "finish"},
        )
        workflow.add_edge("reflect", "plan")
        workflow.add_edge("finish", END)

        # Set entry point
        workflow.set_entry_point("plan")

        self.workflow = workflow.compile()

    async def execute_task(self, task: str, **kwargs) -> TaskResult:
        """Execute task using LangGraph workflow"""
        start_time = time.time()
        self.status = AgentStatus.RUNNING
        result: TaskResult | None = None  # Initialize to avoid unbound variable

        # Start tracing
        self.start_trace(task)

        try:
            with self.tracer.start_as_current_span("agent_task_execution") as span:
                span.set_attributes(
                    {
                        "agent.id": self.id,
                        "agent.role": self.role.value,
                        "task": task,
                    }
                )

                # Initialize state with proper typing
                initial_state: AgentState = {
                    "messages": [HumanMessage(content=task)],
                    "task": task,
                    "context": self.memory.context.copy(),
                    "result": None,
                    "error": None,
                    "iterations": 0,
                    "max_iterations": self.config.max_iter,
                }

                # Execute workflow
                final_state = await self.workflow.ainvoke(initial_state)

                # Extract result
                if final_state.get("error"):
                    result = TaskResult(
                        success=False,
                        result=None,
                        error=final_state["error"],
                        execution_time=time.time() - start_time,
                    )
                else:
                    result = TaskResult(
                        success=True,
                        result=final_state.get("result"),
                        error=None,
                        execution_time=time.time() - start_time,
                    )

                # Update memory
                if final_state.get("messages"):
                    for msg in final_state["messages"]:
                        self.add_message(msg)

                self.status = AgentStatus.COMPLETED
                span.set_attributes(
                    {
                        "result.success": result.success,
                        "result.execution_time": result.execution_time,
                    }
                )

        except Exception as e:
            result = TaskResult(
                success=False,
                result=None,
                error=str(e),
                execution_time=time.time() - start_time,
            )
            self.status = AgentStatus.FAILED

        finally:
            # End tracing
            if result is not None:
                self.end_trace(result)
            else:
                # Fallback in case result was never set
                result = TaskResult(
                    success=False,
                    result=None,
                    error="Unknown error occurred",
                    execution_time=time.time() - start_time,
                )

        return result

    async def _plan_node(self, state: AgentState) -> AgentState:
        """Planning node - analyze task and create plan"""

        # Build planning prompt
        planning_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.get_context_prompt()),
                (
                    "system",
                    "You are in the planning phase. Analyze the task and create a detailed plan.",
                ),
                MessagesPlaceholder(variable_name="messages"),
                (
                    "human",
                    "Task: {task}\n\nCreate a step-by-step plan to complete this task.",
                ),
            ]
        )

        # Get LLM response
        chain = planning_prompt | self.llm

        callbacks = [langfuse_handler] if langfuse_handler else []

        response = await chain.ainvoke(
            {"messages": state["messages"], "task": state["task"]},
            config={"callbacks": callbacks},
        )

        # Update state
        state["messages"].append(response)
        state["context"]["plan"] = response.content

        return state

    async def _execute_node(self, state: AgentState) -> AgentState:
        """Execution node - execute the plan using available tools"""

        execution_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.get_context_prompt()),
                (
                    "system",
                    "You are in the execution phase. Use available tools to execute your plan.",
                ),
                MessagesPlaceholder(variable_name="messages"),
                ("human", "Execute your plan step by step. Use tools when needed."),
            ]
        )

        # Create tool-enabled chain
        # Use hasattr to check if bind_tools is available (ChatOpenAI, ChatAnthropic, etc.)
        if self.tools and hasattr(self.llm, "bind_tools"):
            chain = execution_prompt | self.llm.bind_tools(self.tools)  # type: ignore[attr-defined]
        else:
            chain = execution_prompt | self.llm

        callbacks = [langfuse_handler] if langfuse_handler else []

        response = await chain.ainvoke(
            {"messages": state["messages"]}, config={"callbacks": callbacks}
        )

        # Handle tool calls if present
        if hasattr(response, "tool_calls") and response.tool_calls:
            for tool_call in response.tool_calls:
                # Find and execute tool
                tool = next(
                    (t for t in self.tools if t.name == tool_call["name"]), None
                )
                if tool:
                    try:
                        tool_result = await tool._arun(**tool_call["args"])
                        state["context"][f"tool_{tool_call['name']}_result"] = (
                            tool_result
                        )
                    except Exception as e:
                        state["context"][f"tool_{tool_call['name']}_error"] = str(e)

        state["messages"].append(response)
        state["iterations"] += 1

        return state

    async def _reflect_node(self, state: AgentState) -> AgentState:
        """Reflection node - evaluate progress and decide next steps"""

        reflection_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", self.get_context_prompt()),
                (
                    "system",
                    "You are in the reflection phase. Evaluate your progress and decide if the task is complete.",
                ),
                MessagesPlaceholder(variable_name="messages"),
                (
                    "human",
                    """
            Reflect on your progress:
            1. Have you completed the task successfully?
            2. What has been accomplished so far?
            3. What still needs to be done?
            4. Should you continue or finish?

            Provide a clear assessment and your final answer if the task is complete.
            """,
                ),
            ]
        )

        chain = reflection_prompt | self.llm

        callbacks = [langfuse_handler] if langfuse_handler else []

        response = await chain.ainvoke(
            {"messages": state["messages"]}, config={"callbacks": callbacks}
        )

        state["messages"].append(response)

        # Simple completion detection (can be enhanced)
        completion_indicators = ["task is complete", "finished", "accomplished", "done"]
        if any(
            indicator in response.content.lower() for indicator in completion_indicators
        ):
            state["result"] = response.content

        return state

    async def _finish_node(self, state: AgentState) -> AgentState:
        """Finish node - finalize results"""

        if not state.get("result") and state["messages"]:
            # Extract final result from last message
            last_message = state["messages"][-1]
            state["result"] = last_message.content

        return state

    def _should_continue(self, state: dict[str, Any]) -> str:
        """Determine if agent should continue or finish"""

        # Check if we have a result
        if state.get("result"):
            return "finish"

        # Check iteration limit
        if state["iterations"] >= state["max_iterations"]:
            state["result"] = "Maximum iterations reached. Task may be incomplete."
            return "finish"

        # Check for errors
        if state.get("error"):
            return "finish"

        return "continue"
