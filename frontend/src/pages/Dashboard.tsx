import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Bot, GitBranch, Wrench, Activity, Sparkles, ArrowRight, Plus } from 'lucide-react'
import { api } from '../utils/api'
import { Agent, Workflow, Tool } from '../types'

export function Dashboard() {
  const navigate = useNavigate()

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>(
    'agents',
    () => api.get('/agents').then(res => res.data),
    { retry: 1, refetchOnWindowFocus: false }
  )

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<Workflow[]>(
    'workflows',
    () => api.get('/workflows').then(res => res.data),
    { retry: 1, refetchOnWindowFocus: false }
  )

  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>(
    'tools',
    () => api.get('/tools').then(res => res.data),
    { retry: 1, refetchOnWindowFocus: false }
  )

  const stats = [
    {
      name: 'Agents',
      value: agents.length,
      icon: Bot,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Active AI agents',
      onClick: () => navigate('/agents')
    },
    {
      name: 'Workflows',
      value: workflows.length,
      icon: GitBranch,
      gradient: 'from-green-500 to-green-600',
      description: 'Workflow templates',
      onClick: () => navigate('/canvas')
    },
    {
      name: 'Tools',
      value: tools.length,
      icon: Wrench,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Available tools',
      onClick: () => navigate('/tools')
    },
    {
      name: 'Running',
      value: agents.filter(a => a.status === 'running').length,
      icon: Activity,
      gradient: 'from-orange-500 to-orange-600',
      description: 'Active executions',
      onClick: () => navigate('/agents')
    },
  ]

  const recentAgents = agents.slice(0, 5)
  const recentWorkflows = workflows.slice(0, 5)

  const isLoading = agentsLoading || workflowsLoading || toolsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-1">Your AI orchestration command center</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <button
              key={stat.name}
              onClick={stat.onClick}
              className="macos-card group hover:shadow-lg transition-all duration-300 p-6 text-left cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{stat.description}</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="macos-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Agents</h2>
              <button
                onClick={() => navigate('/agents')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{agent.role}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{agent.goal.slice(0, 50)}...</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    agent.status === 'idle' ? 'bg-gray-200 text-gray-700' :
                    agent.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    agent.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
              {recentAgents.length === 0 && (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">No agents created yet</p>
                  <button
                    onClick={() => navigate('/agents')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create your first agent</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="macos-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Workflows</h2>
              <button
                onClick={() => navigate('/canvas')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentWorkflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                      <GitBranch className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{workflow.name}</div>
                      <div className="text-sm text-gray-500">
                        {workflow.nodes?.length || 0} nodes · {workflow.edges?.length || 0} connections
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    v{workflow.version}
                  </div>
                </div>
              ))}
              {recentWorkflows.length === 0 && (
                <div className="text-center py-12">
                  <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">No workflows created yet</p>
                  <button
                    onClick={() => navigate('/canvas')}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Build your first workflow</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="macos-card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/agents')}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">Create Agent</div>
                <div className="text-sm text-gray-500">Set up a new AI agent</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/canvas')}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-green-50/50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <GitBranch className="w-8 h-8 text-white" />
                </div>
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-green-600">Build Workflow</div>
                <div className="text-sm text-gray-500">Design visual workflows</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/integrations')}
              className="group p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <div className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600">Add Integration</div>
                <div className="text-sm text-gray-500">Connect external apps</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
