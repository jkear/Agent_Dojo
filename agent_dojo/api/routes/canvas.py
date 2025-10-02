"""Canvas API routes for the visual workflow editor"""

import json
from typing import Any

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from agent_dojo.workflows.workflow_manager import WorkflowManager

router = APIRouter()


# Pydantic models for canvas operations
class CanvasNode(BaseModel):
    id: str
    type: str
    position: dict[str, float]
    data: dict[str, Any]
    size: dict[str, float] | None = None


class CanvasEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str | None = None
    targetHandle: str | None = None
    type: str | None = None
    data: dict[str, Any] | None = None


class CanvasState(BaseModel):
    nodes: list[CanvasNode]
    edges: list[CanvasEdge]
    viewport: dict[str, float] = {"x": 0, "y": 0, "zoom": 1}


class CanvasUpdate(BaseModel):
    type: str  # "node_add", "node_update", "node_delete", "edge_add", etc.
    data: dict[str, Any]
    user_id: str | None = None


# In-memory storage for canvas states (replace with database)
canvas_states: dict[str, CanvasState] = {}
active_connections: dict[str, list[WebSocket]] = {}


@router.get("/{canvas_id}/state")
async def get_canvas_state(canvas_id: str):
    """Get current canvas state"""
    if canvas_id not in canvas_states:
        # Create empty canvas
        canvas_states[canvas_id] = CanvasState(nodes=[], edges=[])

    return canvas_states[canvas_id].model_dump()


@router.post("/{canvas_id}/state")
async def save_canvas_state(canvas_id: str, state: CanvasState):
    """Save canvas state"""
    canvas_states[canvas_id] = state

    # Broadcast update to all connected clients
    await broadcast_update(
        canvas_id, {"type": "state_update", "data": state.model_dump()}
    )

    return {"message": "Canvas state saved"}


@router.post("/{canvas_id}/nodes")
async def add_node(canvas_id: str, node: CanvasNode):
    """Add a node to the canvas"""
    if canvas_id not in canvas_states:
        canvas_states[canvas_id] = CanvasState(nodes=[], edges=[])

    canvas_states[canvas_id].nodes.append(node)

    # Broadcast update
    await broadcast_update(canvas_id, {"type": "node_add", "data": node.model_dump()})

    return {"message": "Node added"}


@router.put("/{canvas_id}/nodes/{node_id}")
async def update_node(canvas_id: str, node_id: str, node_data: dict[str, Any]):
    """Update a node on the canvas"""
    if canvas_id not in canvas_states:
        raise HTTPException(status_code=404, detail="Canvas not found")

    canvas = canvas_states[canvas_id]

    # Find and update node
    for _i, node in enumerate(canvas.nodes):
        if node.id == node_id:
            # Update node properties
            for key, value in node_data.items():
                if hasattr(node, key):
                    setattr(node, key, value)
            break
    else:
        raise HTTPException(status_code=404, detail="Node not found")

    # Broadcast update
    await broadcast_update(
        canvas_id, {"type": "node_update", "data": {"id": node_id, **node_data}}
    )

    return {"message": "Node updated"}


@router.delete("/{canvas_id}/nodes/{node_id}")
async def delete_node(canvas_id: str, node_id: str):
    """Delete a node from the canvas"""
    if canvas_id not in canvas_states:
        raise HTTPException(status_code=404, detail="Canvas not found")

    canvas = canvas_states[canvas_id]

    # Remove node
    canvas.nodes = [n for n in canvas.nodes if n.id != node_id]

    # Remove associated edges
    canvas.edges = [
        e for e in canvas.edges if e.source != node_id and e.target != node_id
    ]

    # Broadcast update
    await broadcast_update(canvas_id, {"type": "node_delete", "data": {"id": node_id}})

    return {"message": "Node deleted"}


@router.post("/{canvas_id}/edges")
async def add_edge(canvas_id: str, edge: CanvasEdge):
    """Add an edge to the canvas"""
    if canvas_id not in canvas_states:
        canvas_states[canvas_id] = CanvasState(nodes=[], edges=[])

    canvas_states[canvas_id].edges.append(edge)

    # Broadcast update
    await broadcast_update(canvas_id, {"type": "edge_add", "data": edge.model_dump()})

    return {"message": "Edge added"}


@router.delete("/{canvas_id}/edges/{edge_id}")
async def delete_edge(canvas_id: str, edge_id: str):
    """Delete an edge from the canvas"""
    if canvas_id not in canvas_states:
        raise HTTPException(status_code=404, detail="Canvas not found")

    canvas = canvas_states[canvas_id]
    canvas.edges = [e for e in canvas.edges if e.id != edge_id]

    # Broadcast update
    await broadcast_update(canvas_id, {"type": "edge_delete", "data": {"id": edge_id}})

    return {"message": "Edge deleted"}


@router.post("/{canvas_id}/workflow")
async def convert_to_workflow(
    canvas_id: str, workflow_name: str, workflow_description: str
):
    """Convert canvas to executable workflow"""
    if canvas_id not in canvas_states:
        raise HTTPException(status_code=404, detail="Canvas not found")

    canvas = canvas_states[canvas_id]

    # Convert canvas nodes/edges to workflow format
    workflow_nodes = []
    workflow_edges = []

    for node in canvas.nodes:
        workflow_nodes.append(
            {
                "id": node.id,
                "type": node.data.get("nodeType", "agent"),
                "name": node.data.get("name", node.id),
                "config": node.data.get("config", {}),
                "position": node.position,
            }
        )

    for edge in canvas.edges:
        workflow_edges.append(
            {
                "id": edge.id,
                "source_node_id": edge.source,
                "target_node_id": edge.target,
                "condition": edge.data.get("condition") if edge.data else None,
                "label": edge.data.get("label") if edge.data else None,
            }
        )

    # Create workflow using workflow manager
    workflow_manager = WorkflowManager()

    try:
        workflow = workflow_manager.create_workflow(
            name=workflow_name,
            description=workflow_description,
            nodes=workflow_nodes,
            edges=workflow_edges,
        )

        return {
            "message": "Workflow created successfully",
            "workflow_id": workflow.id,
            "workflow": workflow.model_dump(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Failed to create workflow: {str(e)}"
        )


@router.get("/templates")
async def get_canvas_templates():
    """Get predefined canvas templates"""
    templates = [
        {
            "id": "basic_agent_flow",
            "name": "Basic Agent Flow",
            "description": "Simple agent with input and output",
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 100, "y": 100},
                    "data": {"name": "Start", "nodeType": "start"},
                },
                {
                    "id": "agent1",
                    "type": "agent",
                    "position": {"x": 300, "y": 100},
                    "data": {"name": "Agent", "nodeType": "agent", "config": {}},
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 500, "y": 100},
                    "data": {"name": "End", "nodeType": "end"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "agent1"},
                {"id": "e2", "source": "agent1", "target": "end"},
            ],
        },
        {
            "id": "multi_agent_collaboration",
            "name": "Multi-Agent Collaboration",
            "description": "Multiple agents working together",
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 100, "y": 200},
                    "data": {"name": "Start", "nodeType": "start"},
                },
                {
                    "id": "researcher",
                    "type": "agent",
                    "position": {"x": 300, "y": 100},
                    "data": {
                        "name": "Researcher",
                        "nodeType": "agent",
                        "config": {"role": "researcher"},
                    },
                },
                {
                    "id": "writer",
                    "type": "agent",
                    "position": {"x": 300, "y": 300},
                    "data": {
                        "name": "Writer",
                        "nodeType": "agent",
                        "config": {"role": "writer"},
                    },
                },
                {
                    "id": "reviewer",
                    "type": "agent",
                    "position": {"x": 500, "y": 200},
                    "data": {
                        "name": "Reviewer",
                        "nodeType": "agent",
                        "config": {"role": "reviewer"},
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 700, "y": 200},
                    "data": {"name": "End", "nodeType": "end"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "researcher"},
                {"id": "e2", "source": "start", "target": "writer"},
                {"id": "e3", "source": "researcher", "target": "reviewer"},
                {"id": "e4", "source": "writer", "target": "reviewer"},
                {"id": "e5", "source": "reviewer", "target": "end"},
            ],
        },
    ]

    return templates


# WebSocket for real-time collaboration
@router.websocket("/{canvas_id}/ws")
async def canvas_websocket(websocket: WebSocket, canvas_id: str):
    """WebSocket endpoint for real-time canvas collaboration"""
    await websocket.accept()

    # Add to active connections
    if canvas_id not in active_connections:
        active_connections[canvas_id] = []
    active_connections[canvas_id].append(websocket)

    try:
        while True:
            # Receive updates from client
            data = await websocket.receive_text()
            update = json.loads(data)

            # Broadcast to other connected clients
            await broadcast_update(canvas_id, update, exclude=websocket)

    except WebSocketDisconnect:
        # Remove from active connections
        active_connections[canvas_id].remove(websocket)
        if not active_connections[canvas_id]:
            del active_connections[canvas_id]


async def broadcast_update(
    canvas_id: str, update: dict[str, Any], exclude: WebSocket = None
):
    """Broadcast update to all connected clients"""
    if canvas_id not in active_connections:
        return

    message = json.dumps(update)
    disconnected = []

    for websocket in active_connections[canvas_id]:
        if websocket == exclude:
            continue

        try:
            await websocket.send_text(message)
        except Exception:
            disconnected.append(websocket)

    # Clean up disconnected websockets
    for ws in disconnected:
        active_connections[canvas_id].remove(ws)
