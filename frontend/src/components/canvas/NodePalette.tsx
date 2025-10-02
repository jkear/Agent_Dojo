import { Bot, Play, Square, GitBranch, Wrench, HelpCircle } from 'lucide-react'

const nodeCategories = [
  {
    name: 'Flow Control',
    nodes: [
      { type: 'start', name: 'Start', icon: Play, description: 'Workflow entry point' },
      { type: 'end', name: 'End', icon: Square, description: 'Workflow exit point' },
      { type: 'condition', name: 'Condition', icon: GitBranch, description: 'Conditional branching' },
    ],
  },
  {
    name: 'Agents',
    nodes: [
      { type: 'agent', name: 'Agent', icon: Bot, description: 'AI agent executor' },
      { type: 'parallel', name: 'Parallel', icon: GitBranch, description: 'Parallel execution' },
    ],
  },
  {
    name: 'Tools',
    nodes: [
      { type: 'tool', name: 'Tool', icon: Wrench, description: 'MCP tool integration' },
    ],
  },
]

interface NodePaletteProps {
  onAddNode: (nodeType: string) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="p-4 h-full overflow-y-auto">
      <h3 className="font-semibold text-sm mb-4">Node Palette</h3>
      
      <div className="space-y-6">
        {nodeCategories.map((category) => (
          <div key={category.name}>
            <h4 className="font-medium text-xs text-muted-foreground mb-3 uppercase tracking-wider">
              {category.name}
            </h4>
            
            <div className="space-y-2">
              {category.nodes.map((node) => (
                <button
                  key={node.type}
                  onClick={() => onAddNode(node.type)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded flex items-center justify-center group-hover:bg-primary/20">
                    <node.icon className="w-4 h-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{node.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {node.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}