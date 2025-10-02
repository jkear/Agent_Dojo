export interface Agent {
  id: string
  role: string
  goal: string
  backstory: string
  status: 'idle' | 'running' | 'completed' | 'failed'
  created_at: string
  last_activity: string
  tools: string[]
  memory_size: number
}

export interface AgentCreateRequest {
  role: string
  goal: string
  backstory: string
  max_execution_time?: number
  max_iter?: number
  memory_enabled?: boolean
  verbose?: boolean
  allow_delegation?: boolean
  tools?: string[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  version: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WorkflowNode {
  id: string
  type: 'start' | 'end' | 'agent' | 'tool' | 'condition' | 'parallel'
  name: string
  config: Record<string, any>
  position: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source_node_id: string
  target_node_id: string
  condition?: string
  label?: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  started_at?: string
  completed_at?: string
  error?: string
  state?: Record<string, any>
  results: Record<string, any>
}

export interface Tool {
  name: string
  description: string
  category: string
  version: string
  status: 'available' | 'unavailable' | 'deprecated' | 'maintenance'
  parameters_schema: Record<string, any>
  required_permissions: string[]
  configuration?: Record<string, any>
}

export interface Integration {
  connection_id: string
  app_type: string
  status: 'pending' | 'connected' | 'disconnected' | 'error'
  created_at: string
}

export interface CanvasNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    name: string
    nodeType: string
    config?: Record<string, any>
    [key: string]: any
  }
  size?: { width: number; height: number }
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  data?: Record<string, any>
}