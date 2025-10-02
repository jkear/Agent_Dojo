import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Space,
  Typography,
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    <Avatar
      size={40}
      icon={stat.icon}
      style={{
        backgroundColor: stat.color,
        boxShadow: `0 2px 8px ${stat.color}40`
      }}
    />
    <ArrowRightOutlined style={{ color: '#8E8E93', fontSize: 14 }} />
  </div>List,
    Tag,
    Spin,
    Empty,
    Badge,
    Divider
} from 'antd'
import {
  RobotOutlined,
  BranchesOutlined,
  ToolOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined
} from '@ant-design/icons'
import { api } from '../utils/api'
import { Agent, Workflow, Tool } from '../types'

const { Title, Text, Paragraph } = Typography

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

  const isLoading = agentsLoading || workflowsLoading || toolsLoading

  const stats = [
    {
      title: 'Active Agents',
      value: agents.length,
      icon: <RobotOutlined />,
      color: '#007AFF',
      description: 'AI agents running',
      onClick: () => navigate('/agents')
    },
    {
      title: 'Workflows',
      value: workflows.length,
      icon: <BranchesOutlined />,
      color: '#34C759',
      description: 'Workflow templates',
      onClick: () => navigate('/canvas')
    },
    {
      title: 'Available Tools',
      value: tools.length,
      icon: <ToolOutlined />,
      color: '#AF52DE',
      description: 'Integrated tools',
      onClick: () => navigate('/tools')
    },
    {
      title: 'Integrations',
      value: 5, // Mock value
      icon: <ApiOutlined />,
      color: '#FF9500',
      description: 'Connected services',
      onClick: () => navigate('/integrations')
    },
  ]

  const recentAgents = agents.slice(0, 5)
  const recentWorkflows = workflows.slice(0, 5)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'processing'
      case 'completed':
        return 'success'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <Text type="secondary" style={{ marginTop: 16 }}>
          Loading dashboard...
        </Text>
      </div>
    )
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Space align="center" size="middle">
            <Avatar
              size={48}
              icon={<RobotOutlined />}
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #0051D2 100%)',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
              }}
            />
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
                Dashboard
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Your AI orchestration command center
              </Text>
            </div>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                onClick={stat.onClick}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(60, 60, 67, 0.12)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-out'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Avatar
                      size={40}
                      icon={stat.icon}
                      style={{
                        backgroundColor: stat.color,
                        boxShadow: `0 2px 8px ${stat.color}40`
                      }}
                    />
                    <ArrowRightOutlined style={{ color: '#8E8E93', fontSize: 14 }} />
                </Space>
                <Statistic
                  value={stat.value}
                  valueStyle={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: '#000000',
                    lineHeight: 1.2
                  }}
                />
                <div>
                  <Text strong style={{ fontSize: 14, color: '#000000' }}>
                    {stat.title}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stat.description}
                  </Text>
                </div>
              </Space>
            </Card>
            </Col>
          ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: 16 }}>Recent Agents</Text>}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(60, 60, 67, 0.12)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {recentAgents.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={recentAgents}
                renderItem={(agent) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<RobotOutlined />}
                          style={{ backgroundColor: '#007AFF' }}
                        />
                      }
                      title={<Text strong>{agent.role}</Text>}
                      description={
                        <Space>
                          <Text type="secondary" ellipsis>
                            {agent.goal?.slice(0, 40)}...
                          </Text>
                          <Tag color={getStatusColor(agent.status)}>
                            {agent.status}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={<RobotOutlined style={{ fontSize: 48, color: '#C7C7CC' }} />}
                description="No agents created yet"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: 16 }}>Recent Workflows</Text>}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(60, 60, 67, 0.12)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {recentWorkflows.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={recentWorkflows}
                renderItem={(workflow) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<BranchesOutlined />}
                          style={{ backgroundColor: '#34C759' }}
                        />
                      }
                      title={<Text strong>{workflow.name}</Text>}
                      description={
                        <Text type="secondary">
                          {workflow.nodes?.length || 0} nodes • v{workflow.version}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={<BranchesOutlined style={{ fontSize: 48, color: '#C7C7CC' }} />}
                description="No workflows created yet"
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
    </div >
  )
}
    },