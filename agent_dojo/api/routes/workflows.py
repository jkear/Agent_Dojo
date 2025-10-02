"""Workflows API routes"""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent_dojo.workflows.workflow_manager import (
    NodeType,
    WorkflowManager,
)

router = APIRouter()


# Pydantic models
class NodeCreateRequest(BaseModel):
    id: str
    type: NodeType
    name: str
    config: dict[str, Any] = {}
    position: dict[str, float] = {}


class EdgeCreateRequest(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    condition: str | None = None
    label: str | None = None


class WorkflowCreateRequest(BaseModel):
    name: str
    description: str
    nodes: list[NodeCreateRequest]
    edges: list[EdgeCreateRequest]


class WorkflowExecuteRequest(BaseModel):
    initial_variables: dict[str, Any] | None = {}


# Global workflow manager (replace with proper DI)
workflow_manager = WorkflowManager()


@router.post("/", response_model=dict)
async def create_workflow(request: WorkflowCreateRequest):
    """Create a new workflow"""
    try:
        nodes = [node.model_dump() for node in request.nodes]
        edges = [edge.model_dump() for edge in request.edges]

        workflow = workflow_manager.create_workflow(
            name=request.name, description=request.description, nodes=nodes, edges=edges
        )

        return workflow.model_dump()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[dict])
async def list_workflows():
    """List all workflows"""
    workflows = workflow_manager.list_workflows()
    return [w.model_dump() for w in workflows]


@router.get("/{workflow_id}", response_model=dict)
async def get_workflow(workflow_id: str):
    """Get workflow by ID"""
    workflow = workflow_manager.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    return workflow.model_dump()


@router.post("/{workflow_id}/execute", response_model=dict)
async def execute_workflow(workflow_id: str, request: WorkflowExecuteRequest):
    """Execute a workflow"""
    try:
        execution = await workflow_manager.execute_workflow(
            workflow_id=workflow_id, initial_variables=request.initial_variables
        )

        return execution.model_dump()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workflow_id}/executions", response_model=list[dict])
async def list_workflow_executions(workflow_id: str):
    """List executions for a workflow"""
    executions = workflow_manager.list_executions(workflow_id=workflow_id)
    return [e.model_dump() for e in executions]


@router.get("/executions/{execution_id}", response_model=dict)
async def get_execution(execution_id: str):
    """Get execution by ID"""
    execution = workflow_manager.get_execution(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    return execution.model_dump()


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    if not workflow_manager.delete_workflow(workflow_id):
        raise HTTPException(status_code=404, detail="Workflow not found")

    return {"message": "Workflow deleted successfully"}


@router.post("/{workflow_id}/validate")
async def validate_workflow(workflow_id: str):
    """Validate workflow structure"""
    workflow = workflow_manager.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    try:
        workflow_manager._validate_workflow(workflow)
        return {"valid": True, "message": "Workflow is valid"}

    except Exception as e:
        return {"valid": False, "message": str(e)}
