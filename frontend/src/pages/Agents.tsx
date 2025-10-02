import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Play, Trash2, Settings } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { CreateAgentModal } from '../components/modals/CreateAgentModal'
import { api } from '../utils/api'
import { Agent, AgentCreateRequest } from '../types'
import toast from 'react-hot-toast'

export function Agents() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: agents = [], isLoading } = useQuery<Agent[]>(
    'agents',
    () => api.get('/agents').then(res => res.data),
    { refetchInterval: 5000 }
  )

  const createAgentMutation = useMutation(
    (agentData: AgentCreateRequest) => api.post('/agents', agentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agents')
        toast.success('Agent created successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to create agent')
      }
    }
  )

  const deleteAgentMutation = useMutation(
    (agentId: string) => api.delete(`/agents/${agentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('agents')
        toast.success('Agent deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete agent')
      }
    }
  )

  const handleCreateAgent = async (agentData: AgentCreateRequest) => {
    await createAgentMutation.mutateAsync(agentData)
  }

  const handleExecuteTask = async (agentId: string) => {
    const task = prompt('Enter task for the agent:')
    if (!task) return

    try {
      const response = await api.post(`/agents/${agentId}/execute`, {
        task,
        parameters: {}
      })
      toast.success('Task started successfully')
      queryClient.invalidateQueries('agents')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to execute task')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    await deleteAgentMutation.mutateAsync(agentId)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading agents...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{agent.role}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${agent.status === 'idle' ? 'bg-gray-100 text-gray-700' :
                agent.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  agent.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                }`}>
                {agent.status}
              </span>
            </div>

            <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {agent.goal}
            </div>

            <div className="text-xs text-muted-foreground mb-4">
              <div>Tools: {agent.tools.length}</div>
              <div>Memory: {agent.memory_size} messages</div>
              <div>Last active: {new Date(agent.last_activity).toLocaleDateString()}</div>
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleExecuteTask(agent.id)}
                disabled={agent.status === 'running'}
              >
                <Play className="w-3 h-3 mr-1" />
                Execute
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAgent(agent)}
              >
                <Settings className="w-3 h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteAgent(agent.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No agents created yet</div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create your first agent
          </Button>
        </div>
      )}

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAgent}
      />
    </div>
  )
}