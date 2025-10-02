import { Handle, Position } from 'reactflow'
import { Play, Square, Bot, Wrench, GitBranch } from 'lucide-react'

// Start Node
export function StartNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md min-w-[120px]">
      <div className="flex items-center space-x-2">
        <Play className="w-4 h-4" />
        <span className="font-medium">{data.name}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-green-600" />
    </div>
  )
}

// End Node
export function EndNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md min-w-[120px]">
      <div className="flex items-center space-x-2">
        <Square className="w-4 h-4" />
        <span className="font-medium">{data.name}</span>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-red-600" />
    </div>
  )
}

// Agent Node
export function AgentNode({ data, selected }: { data: any, selected: boolean }) {
  return (
    <div className={`px-4 py-3 bg-blue-500 text-white rounded-lg shadow-md min-w-[160px] ${
      selected ? 'ring-2 ring-blue-300' : ''
    }`}>
      <div className="flex items-center space-x-2 mb-1">
        <Bot className="w-4 h-4" />
        <span className="font-medium">{data.name}</span>
      </div>
      {data.config?.role && (
        <div className="text-xs opacity-75 capitalize">{data.config.role}</div>
      )}
      <Handle type="target" position={Position.Left} className="!bg-blue-600" />
      <Handle type="source" position={Position.Right} className="!bg-blue-600" />
    </div>
  )
}

// Tool Node
export function ToolNode({ data, selected }: { data: any, selected: boolean }) {
  return (
    <div className={`px-4 py-3 bg-purple-500 text-white rounded-lg shadow-md min-w-[140px] ${
      selected ? 'ring-2 ring-purple-300' : ''
    }`}>
      <div className="flex items-center space-x-2 mb-1">
        <Wrench className="w-4 h-4" />
        <span className="font-medium">{data.name}</span>
      </div>
      {data.config?.tool_name && (
        <div className="text-xs opacity-75">{data.config.tool_name}</div>
      )}
      <Handle type="target" position={Position.Left} className="!bg-purple-600" />
      <Handle type="source" position={Position.Right} className="!bg-purple-600" />
    </div>
  )
}

// Condition Node
export function ConditionNode({ data, selected }: { data: any, selected: boolean }) {
  return (
    <div className={`px-4 py-3 bg-orange-500 text-white rounded-lg shadow-md min-w-[140px] ${
      selected ? 'ring-2 ring-orange-300' : ''
    }`}>
      <div className="flex items-center space-x-2 mb-1">
        <GitBranch className="w-4 h-4" />
        <span className="font-medium">{data.name}</span>
      </div>
      <div className="text-xs opacity-75">Conditional</div>
      <Handle type="target" position={Position.Left} className="!bg-orange-600" />
      <Handle type="source" position={Position.Right} className="!bg-orange-600" />
      <Handle type="source" position={Position.Bottom} className="!bg-orange-600" id="false" />
    </div>
  )
}

// Parallel Node
export function ParallelNode({ data, selected }: { data: any, selected: boolean }) {
  return (
    <div className={`px-4 py-3 bg-teal-500 text-white rounded-lg shadow-md min-w-[140px] ${
      selected ? 'ring-2 ring-teal-300' : ''
    }`}>
      <div className="flex items-center space-x-2 mb-1">
        <GitBranch className="w-4 h-4" />
        <span className="font-medium">{data.name}</span>
      </div>
      <div className="text-xs opacity-75">Parallel</div>
      <Handle type="target" position={Position.Left} className="!bg-teal-600" />
      <Handle type="source" position={Position.Right} className="!bg-teal-600" />
      <Handle type="source" position={Position.Bottom} className="!bg-teal-600" id="branch" />
    </div>
  )
}

export const CustomNodes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  parallel: ParallelNode,
}