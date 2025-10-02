import { create } from 'zustand'
import { CanvasNode, CanvasEdge, Workflow } from '../types'
import { api } from '../utils/api'

interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedNode: string | null
  isExecuting: boolean
  
  // Actions
  setNodes: (nodes: CanvasNode[]) => void
  setEdges: (edges: CanvasEdge[]) => void
  setSelectedNode: (nodeId: string | null) => void
  loadCanvas: (canvasId: string) => Promise<{ nodes: CanvasNode[], edges: CanvasEdge[] } | null>
  saveCanvas: (canvasId: string, state: { nodes: CanvasNode[], edges: CanvasEdge[] }) => Promise<void>
  executeWorkflow: (canvasId: string, name: string, description: string) => Promise<any>
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  isExecuting: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),

  loadCanvas: async (canvasId: string) => {
    try {
      const response = await api.get(`/canvas/${canvasId}/state`)
      return response.data
    } catch (error) {
      console.error('Failed to load canvas:', error)
      return null
    }
  },

  saveCanvas: async (canvasId: string, state: { nodes: CanvasNode[], edges: CanvasEdge[] }) => {
    try {
      await api.post(`/canvas/${canvasId}/state`, {
        nodes: state.nodes,
        edges: state.edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      })
    } catch (error) {
      console.error('Failed to save canvas:', error)
      throw error
    }
  },

  executeWorkflow: async (canvasId: string, name: string, description: string) => {
    set({ isExecuting: true })
    try {
      const response = await api.post(`/canvas/${canvasId}/workflow`, {
        workflow_name: name,
        workflow_description: description
      })
      return response.data
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      throw error
    } finally {
      set({ isExecuting: false })
    }
  },
}))