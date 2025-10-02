"""Agents API routes"""


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent_dojo.agents.base_agent import AgentConfig, AgentRole, BaseAgent
from agent_dojo.core.exceptions import AgentException

router = APIRouter()


# Pydantic models for API
class AgentCreateRequest(BaseModel):
    role: AgentRole
    goal: str
    backstory: str
    max_execution_time: int | None = 300
    max_iter: int | None = 10
    memory_enabled: bool | None = True
    verbose: bool | None = False
    allow_delegation: bool | None = False
    tools: list[str] | None = []


class AgentResponse(BaseModel):
    id: str
    role: str
    goal: str
    backstory: str
    status: str
    created_at: str
    last_activity: str
    tools: list[str]
    memory_size: int


class TaskExecutionRequest(BaseModel):
    task: str
    parameters: dict | None = {}


# In-memory storage for demo (replace with database)
agents_store: dict[str, BaseAgent] = {}


@router.post("/", response_model=AgentResponse)
async def create_agent(request: AgentCreateRequest):
    """Create a new agent"""
    try:
        from langchain_openai import ChatOpenAI

        from agent_dojo.agents.langgraph_agent import LangGraphAgent
        from agent_dojo.core.config import settings

        # Verify API key is available
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY not configured. Please set it in your .env file."
            )

        config = AgentConfig(**request.model_dump())
        llm = ChatOpenAI(temperature=0.1, api_key=settings.OPENAI_API_KEY)

        agent = LangGraphAgent(config=config, llm=llm)
        agents_store[agent.id] = agent

        return AgentResponse(**agent.to_dict())

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")


@router.get("/", response_model=list[AgentResponse])
async def list_agents():
    """List all agents"""
    return [AgentResponse(**agent.to_dict()) for agent in agents_store.values()]


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get agent by ID"""
    agent = agents_store.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentResponse(**agent.to_dict())


@router.post("/{agent_id}/execute")
async def execute_task(agent_id: str, request: TaskExecutionRequest):
    """Execute a task with the agent"""
    agent = agents_store.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    try:
        result = await agent.execute_task(request.task, **request.parameters)
        return result.model_dump()

    except AgentException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent"""
    if agent_id not in agents_store:
        raise HTTPException(status_code=404, detail="Agent not found")

    del agents_store[agent_id]
    return {"message": "Agent deleted successfully"}


@router.put("/{agent_id}/tools")
async def update_agent_tools(agent_id: str, tool_names: list[str]):
    """Update agent's tools"""
    agent = agents_store.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # TODO: Implement tool updating logic with tool_names
    return {"message": "Tools update not yet implemented", "tool_names": tool_names}

    # TODO: Get tools from tool manager and assign to agent
    return {"message": "Agent tools updated successfully"}


@router.get("/{agent_id}/memory")
async def get_agent_memory(agent_id: str):
    """Get agent's memory"""
    agent = agents_store.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return {
        "short_term": [msg.content for msg in agent.memory.short_term],
        "context": agent.memory.context,
        "long_term": agent.memory.long_term,
    }
