import { useState } from 'react'
import { useQuery } from 'react-query'
import { Wrench, Play, Settings, ExternalLink, Plus, Link as LinkIcon, Search } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { api } from '../utils/api'
import { Tool } from '../types'
import toast from 'react-hot-toast'
import axios from 'axios'

interface SmitheryServer {
  qualifiedName: string
  displayName: string | null
  description: string | null
  useCount: number
  remote: boolean
  createdAt: string
  homepage: string
}

interface SmitheryResponse {
  servers: SmitheryServer[]
  pagination: {
    currentPage: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

export function Tools() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showBrowseModal, setShowBrowseModal] = useState(false)
  const [serverUrl, setServerUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: tools = [], isLoading } = useQuery<Tool[]>(
    'tools',
    () => api.get('/tools').then(res => res.data)
  )

  // Query Smithery Registry API
  const { data: smitheryServers, isLoading: isLoadingServers } = useQuery<SmitheryResponse>(
    ['smithery-servers', searchQuery, currentPage],
    async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      params.append('page', currentPage.toString())
      params.append('pageSize', '12')

      const response = await axios.get(`https://registry.smithery.ai/servers?${params.toString()}`)
      return response.data
    },
    {
      enabled: showBrowseModal,
      keepPreviousData: true
    }
  )

  const handleExecuteTool = async (toolName: string) => {
    // This is a simplified example - in reality you'd have a proper form
    const parameters = prompt('Enter tool parameters (JSON):')
    if (!parameters) return

    try {
      const params = JSON.parse(parameters)
      const response = await api.post(`/tools/${toolName}/execute`, {
        parameters: params,
        user_permissions: []
      })

      if (response.data.success) {
        toast.success('Tool executed successfully')
        console.log('Tool result:', response.data.result)
      } else {
        toast.error(`Tool execution failed: ${response.data.error}`)
      }
    } catch (error) {
      toast.error('Invalid JSON parameters or execution failed')
    }
  }

  const handleConnectMCPServer = async (url?: string) => {
    const urlToConnect = url || serverUrl
    if (!urlToConnect) {
      toast.error('Please enter a server URL')
      return
    }

    try {
      // TODO: Implement MCP server connection
      toast.success(`Connecting to MCP server: ${urlToConnect}`)
      setShowConnectModal(false)
      setShowBrowseModal(false)
      setServerUrl('')
    } catch (error) {
      toast.error('Failed to connect to MCP server')
    }
  }

  const getServerUrl = (qualifiedName: string) => {
    return `https://server.smithery.ai/${qualifiedName}/mcp`
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'communication': 'bg-blue-100 text-blue-700',
      'data_processing': 'bg-green-100 text-green-700',
      'file_operations': 'bg-purple-100 text-purple-700',
      'web_scraping': 'bg-orange-100 text-orange-700',
      'api_integration': 'bg-pink-100 text-pink-700',
      'database': 'bg-red-100 text-red-700',
      'analytics': 'bg-yellow-100 text-yellow-700',
      'custom': 'bg-gray-100 text-gray-700'
    }
    return colors[category as keyof typeof colors] || colors.custom
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tools...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Smithery MCP Header */}
      <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">MCP Tools</h1>
            <p className="text-muted-foreground">
              Connect to Model Context Protocol servers hosted on Smithery
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Powered by</div>
            <a
              href="https://smithery.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <span className="font-bold text-lg">Smithery</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-start space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-4 h-4" />
            <span>Connect via server URLs: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">https://server.smithery.ai/&#123;server&#125;/mcp</code></span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-3">
          <Button onClick={() => setShowBrowseModal(true)}>
            <Search className="w-4 h-4 mr-2" />
            Browse Servers
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConnectModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect by URL
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://smithery.ai', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Smithery.ai
          </Button>
        </div>
      </div>      {/* Connect MCP Server Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConnectModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Connect MCP Server</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter a Smithery server URL to connect. Example: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">https://server.smithery.ai/exa/mcp</code>
            </p>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://server.smithery.ai/{server}/mcp"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowConnectModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleConnectMCPServer()}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Smithery Servers Modal */}
      {showBrowseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBrowseModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Browse MCP Servers on Smithery</h2>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search servers... (try: memory, notion, slack)"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Server List */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              {isLoadingServers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading servers...</div>
                </div>
              ) : smitheryServers && smitheryServers.servers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {smitheryServers.servers.map((server) => (
                    <div key={server.qualifiedName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{server.displayName || server.qualifiedName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{server.qualifiedName}</p>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>{server.useCount}</span>
                          <span>uses</span>
                        </div>
                      </div>

                      {server.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {server.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                          {getServerUrl(server.qualifiedName)}
                        </code>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(server.homepage, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConnectMCPServer(getServerUrl(server.qualifiedName))}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Connect
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <p>No servers found</p>
                  <p className="text-sm">Try a different search query</p>
                </div>
              )}

              {/* Pagination */}
              {smitheryServers && smitheryServers.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {smitheryServers.pagination.currentPage} of {smitheryServers.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === smitheryServers.pagination.totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button variant="ghost" onClick={() => setShowBrowseModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.name} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{tool.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(tool.category)}`}>
                {tool.category.replace('_', ' ')}
              </span>
            </div>

            <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {tool.description}
            </div>

            <div className="text-xs text-muted-foreground mb-4">
              <div className="flex items-center justify-between mb-1">
                <span>Version:</span>
                <span>{tool.version}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span>Status:</span>
                <span className={`capitalize ${tool.status === 'available' ? 'text-green-600' :
                  tool.status === 'deprecated' ? 'text-red-600' :
                    tool.status === 'maintenance' ? 'text-yellow-600' :
                      'text-gray-600'
                  }`}>
                  {tool.status}
                </span>
              </div>
              {tool.required_permissions.length > 0 && (
                <div>
                  <span>Permissions:</span>
                  <div className="text-xs mt-1">
                    {tool.required_permissions.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleExecuteTool(tool.name)}
                disabled={tool.status !== 'available'}
              >
                <Play className="w-3 h-3 mr-1" />
                Execute
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Show tool schema
                  alert(JSON.stringify(tool.parameters_schema, null, 2))
                }}
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>

            {/* Parameters Preview */}
            {tool.parameters_schema && Object.keys(tool.parameters_schema).length > 0 && (
              <details className="mt-4">
                <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">
                  Parameters Schema
                </summary>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                  {JSON.stringify(tool.parameters_schema, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {tools.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No tools available</div>
          <Button>
            Add your first tool
          </Button>
        </div>
      )}
    </div>
  )
}