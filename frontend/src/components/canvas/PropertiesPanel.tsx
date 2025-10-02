import { useState } from 'react'
import { Node } from 'reactflow'
import { Settings, Info } from 'lucide-react'

interface PropertiesPanelProps {
  selectedNode: Node | null
  onUpdateNode: (nodeId: string, updates: any) => void
}

export function PropertiesPanel({ selectedNode, onUpdateNode }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'info'>('properties')

  if (!selectedNode) {
    return (
      <div className="p-4 h-full">
        <h3 className="font-semibold text-sm mb-4">Properties</h3>
        <div className="text-center text-muted-foreground py-8">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a node to edit its properties</p>
        </div>
      </div>
    )
  }

  const handleFieldChange = (field: string, value: any) => {
    const updates = { [field]: value }
    if (field === 'name') {
      // Update both data.name and the node label
      updates.data = { ...selectedNode.data, name: value }
    } else {
      updates.data = { ...selectedNode.data, config: { ...selectedNode.data.config, [field]: value } }
    }
    onUpdateNode(selectedNode.id, updates)
  }

  return (
    <div className="p-4 h-full">
      <div className="flex items-center space-x-2 mb-4">
        <h3 className="font-semibold text-sm flex-1">Properties</h3>
        <div className="flex rounded-lg border">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-1 text-xs rounded-l-lg ${
              activeTab === 'properties'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1 text-xs rounded-r-lg ${
              activeTab === 'info'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
      </div>

      {activeTab === 'properties' && (
        <div className="space-y-4">
          {/* Node Name */}
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              type="text"
              value={selectedNode.data.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Node Type */}
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <div className="px-3 py-2 text-sm bg-muted rounded">
              {selectedNode.data.nodeType}
            </div>
          </div>

          {/* Agent-specific properties */}
          {selectedNode.data.nodeType === 'agent' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">Role</label>
                <select
                  value={selectedNode.data.config?.role || 'researcher'}
                  onChange={(e) => handleFieldChange('role', e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="researcher">Researcher</option>
                  <option value="writer">Writer</option>
                  <option value="analyst">Analyst</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Goal</label>
                <textarea
                  value={selectedNode.data.config?.goal || ''}
                  onChange={(e) => handleFieldChange('goal', e.target.value)}
                  placeholder="What should this agent accomplish?"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Backstory</label>
                <textarea
                  value={selectedNode.data.config?.backstory || ''}
                  onChange={(e) => handleFieldChange('backstory', e.target.value)}
                  placeholder="Agent's background and expertise"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Tool-specific properties */}
          {selectedNode.data.nodeType === 'tool' && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">Tool</label>
                <select
                  value={selectedNode.data.config?.tool_name || ''}
                  onChange={(e) => handleFieldChange('tool_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select tool...</option>
                  <option value="file_operations">File Operations</option>
                  <option value="web_scraping">Web Scraping</option>
                  <option value="database">Database</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Parameters</label>
                <textarea
                  value={JSON.stringify(selectedNode.data.config?.parameters || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const params = JSON.parse(e.target.value)
                      handleFieldChange('parameters', params)
                    } catch (error) {
                      // Invalid JSON, ignore for now
                    }
                  }}
                  placeholder='{"key": "value"}'
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
                  rows={4}
                />
              </div>
            </>
          )}

          {/* Condition-specific properties */}
          {selectedNode.data.nodeType === 'condition' && (
            <div>
              <label className="block text-xs font-medium mb-1">Condition</label>
              <textarea
                value={selectedNode.data.config?.condition || ''}
                onChange={(e) => handleFieldChange('condition', e.target.value)}
                placeholder="Enter condition logic"
                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono"
                rows={3}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-medium mb-1">Node ID</div>
            <div className="text-muted-foreground font-mono text-xs">
              {selectedNode.id}
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Position</div>
            <div className="text-muted-foreground">
              x: {Math.round(selectedNode.position.x)}, y: {Math.round(selectedNode.position.y)}
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Type</div>
            <div className="text-muted-foreground">
              {selectedNode.data.nodeType}
            </div>
          </div>

          {selectedNode.data.config && Object.keys(selectedNode.data.config).length > 0 && (
            <div>
              <div className="font-medium mb-1">Configuration</div>
              <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(selectedNode.data.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}