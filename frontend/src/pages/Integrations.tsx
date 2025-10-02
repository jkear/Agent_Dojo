import { useState } from 'react'
import { useQuery } from 'react-query'
import { Plus, Link, Unlink, ExternalLink } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { api } from '../utils/api'
import { Integration } from '../types'
import toast from 'react-hot-toast'

const APP_ICONS = {
  gmail: '📧',
  slack: '💬',
  github: '🐙',
  notion: '📝',
  googledrive: '📁',
  googlecalendar: '📅',
  trello: '📋',
  asana: '✅',
  discord: '🎮',
  twitter: '🐦',
  linkedin: '💼',
  hubspot: '🎯',
  salesforce: '☁️',
  zoom: '📹',
  dropbox: '📦'
}

export function Integrations() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null)

  // Use a consistent user ID (in production, this would come from auth context)
  const userId = 'default_user'

  const { data: availableApps = [], isLoading: appsLoading } = useQuery(
    'available-apps',
    () => api.get('/integrations/apps/available').then(res => res.data)
  )

  const { data: connectedApps = [], isLoading: connectionsLoading, refetch } = useQuery<Integration[]>(
    'connected-apps',
    () => api.get(`/integrations/apps/connected/${userId}`).then(res => res.data)
  )

  const handleConnectApp = async (appType: string) => {
    try {
      const response = await api.post('/integrations/apps/connect', {
        app_type: appType,
        user_id: userId
      })

      if (response.data.auth_url) {
        // Open OAuth window
        window.open(response.data.auth_url, '_blank', 'width=600,height=600')
        toast.success('OAuth window opened. Please complete authentication.')

        // Poll for connection status
        const checkConnection = async () => {
          try {
            const status = await api.get(`/integrations/apps/verify/${response.data.connection_id}`)
            if (status.data.status === 'connected') {
              toast.success('App connected successfully!')
              refetch()
            } else if (status.data.status === 'pending') {
              setTimeout(checkConnection, 2000)
            }
          } catch (error) {
            toast.error('Failed to verify connection')
          }
        }

        setTimeout(checkConnection, 2000)
      }
    } catch (error) {
      toast.error('Failed to initiate connection')
    }
  }

  const handleDisconnectApp = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this app?')) return

    try {
      await api.delete(`/integrations/apps/${connectionId}`)
      toast.success('App disconnected successfully')
      refetch()
    } catch (error) {
      toast.error('Failed to disconnect app')
    }
  }

  const getAppIcon = (appType: string) => {
    return APP_ICONS[appType as keyof typeof APP_ICONS] || '🔗'
  }

  const isConnected = (appType: string) => {
    return connectedApps.some(conn => conn.app_type === appType)
  }

  if (appsLoading || connectionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading integrations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Composio Branding Header */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Integrations</h1>
            <p className="text-muted-foreground">
              Connect your favorite apps and services to enhance your workflows
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Powered by</div>
            <a
              href="https://composio.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <span className="font-bold text-lg">Composio</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Connected Apps */}
      {connectedApps.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Connected Apps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedApps.map((integration) => (
              <div key={integration.connection_id} className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getAppIcon(integration.app_type)}</div>
                    <div>
                      <div className="font-medium capitalize">{integration.app_type.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-sm text-muted-foreground">
                        Connected {new Date(integration.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${integration.status === 'connected' ? 'bg-green-100 text-green-700' :
                    integration.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                    {integration.status}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnectApp(integration.connection_id)}
                  >
                    <Unlink className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Show available tools for this app
                      toast.success('Tools panel would open here')
                    }}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Tools
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Apps */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Apps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableApps.map((app: any) => {
            const connected = isConnected(app.app_id)

            return (
              <div key={app.app_id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl">{getAppIcon(app.app_id)}</div>
                  <div>
                    <div className="font-medium">{app.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </div>
                  </div>
                </div>

                {app.categories && app.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {app.categories.slice(0, 3).map((category: string) => (
                      <span key={category} className="px-2 py-1 text-xs bg-muted rounded">
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex space-x-2">
                  {connected ? (
                    <Button variant="outline" size="sm" disabled>
                      <Link className="w-3 h-3 mr-1" />
                      Connected
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnectApp(app.app_id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {availableApps.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No integrations available</div>
          <p className="text-sm text-muted-foreground">
            Check your Composio configuration
          </p>
        </div>
      )}
    </div>
  )
}