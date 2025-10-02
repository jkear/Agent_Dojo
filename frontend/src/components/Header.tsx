import { Layout, Space, Avatar, Badge, Button, Dropdown, Typography } from 'antd'
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'

const { Header: AntHeader } = Layout
const { Text } = Typography

interface HeaderProps {
  collapsed?: boolean
  onCollapse?: () => void
}

export function Header({ collapsed, onCollapse }: HeaderProps) {
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
    },
  ]

  return (
    <AntHeader
      className="macos-toolbar"
      style={{
        padding: '0 24px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(60, 60, 67, 0.36)',
        display: 'flex',
        alignItems: 'center',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Space align="center" size="large">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onCollapse}
          style={{
            fontSize: '16px',
            width: 32,
            height: 32,
          }}
        />

        <Space align="center" size="middle">
          <img
            src="/icons/main_frontview_32x32.png"
            alt="Agent Dojo"
            style={{ width: 32, height: 32 }}
          />
          <div>
            <Text
              strong
              style={{
                fontSize: '18px',
                color: '#000000',
                fontWeight: 600,
              }}
            >
              Agent Dojo
            </Text>
            <br />
            <Text
              type="secondary"
              style={{
                fontSize: '12px',
                color: '#6D6D70'
              }}
            >
              AI Agent Orchestration Platform
            </Text>
          </div>
        </Space>
      </Space>

      <Space
        align="center"
        size="middle"
        style={{ marginLeft: 'auto' }}
      >
        <Badge count={3} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{
              fontSize: '16px',
              width: 32,
              height: 32,
            }}
          />
        </Badge>

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button
            type="text"
            style={{
              padding: '4px 8px',
              height: 'auto',
              borderRadius: 16,
            }}
          >
            <Space align="center" size="small">
              <Avatar
                size={24}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: '#007AFF'
                }}
              />
              <Text
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000000'
                }}
              >
                User
              </Text>
            </Space>
          </Button>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}