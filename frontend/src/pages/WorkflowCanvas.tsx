import { useCallback, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { CanvasToolbar } from '../components/canvas/CanvasToolbar'
import { NodePalette } from '../components/canvas/NodePalette'
import { PropertiesPanel } from '../components/canvas/PropertiesPanel'
import { CustomNodes } from '../components/canvas/CustomNodes'
import { useCanvasStore } from '../stores/canvasStore'
import { Button } from '../components/ui/Button'
import { PlayIcon, SaveIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const nodeTypes = CustomNodes

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export function WorkflowCanvas() {
  const { canvasId } = useParams()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(true)
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true)
  
  const { 
    loadCanvas, 
    saveCanvas, 
    executeWorkflow,
    isExecuting 
  } = useCanvasStore()

  // Load canvas state on mount
  useEffect(() => {
    if (canvasId) {
      loadCanvas(canvasId).then((state) => {
        if (state) {
          setNodes(state.nodes || [])
          setEdges(state.edges || [])
        }
      })
    }
  }, [canvasId, loadCanvas])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleSave = async () => {
    try {
      await saveCanvas(canvasId || 'new', { nodes, edges })
      toast.success('Canvas saved successfully')
    } catch (error) {
      toast.error('Failed to save canvas')
    }
  }

  const handleExecute = async () => {
    if (!canvasId) {
      toast.error('Please save the canvas first')
      return
    }

    try {
      const result = await executeWorkflow(canvasId, 'Workflow Execution', 'Generated from canvas')
      toast.success('Workflow execution started')
    } catch (error) {
      toast.error('Failed to start workflow execution')
    }
  }

  const handleAddNode = (nodeType: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { x: 250, y: 150 },
      data: {
        name: `${nodeType} Node`,
        nodeType,
        config: {}
      },
    }
    setNodes((nodes) => [...nodes, newNode])
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Node Palette */}
      {isPaletteOpen && (
        <div className="w-64 border-r bg-card">
          <NodePalette onAddNode={handleAddNode} />
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          
          {/* Toolbar Panel */}
          <Panel position="top-left">
            <CanvasToolbar 
              isPaletteOpen={isPaletteOpen}
              setIsPaletteOpen={setIsPaletteOpen}
              isPropertiesOpen={isPropertiesOpen}
              setIsPropertiesOpen={setIsPropertiesOpen}
            />
          </Panel>

          {/* Action Buttons */}
          <Panel position="top-right">
            <div className="flex space-x-2">
              <Button onClick={handleSave} variant="outline" size="sm">
                <SaveIcon className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button 
                onClick={handleExecute} 
                disabled={isExecuting}
                size="sm"
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                {isExecuting ? 'Executing...' : 'Execute'}
              </Button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {isPropertiesOpen && (
        <div className="w-80 border-l bg-card">
          <PropertiesPanel 
            selectedNode={selectedNode}
            onUpdateNode={(nodeId, updates) => {
              setNodes((nodes) =>
                nodes.map((node) =>
                  node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
                )
              )
            }}
          />
        </div>
      )}
    </div>
  )
}