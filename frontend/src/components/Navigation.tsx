import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  DashboardOutlined,
  BranchesOutlined,
  RobotOutlined,
  ToolOutlined,
  ApiOutlined,
  SettingOutlined,
} from '@ant-design/icons'

interface NavigationProps {
  collapsed?: boolean
}

const navigation = [
  {
    key: '/',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    href: '/'
  },
  {
    key: '/canvas',
    label: 'Canvas',
    icon: <BranchesOutlined />,
    href: '/canvas'
  },
  {
    key: '/agents',
    label: 'Agents',
    icon: <RobotOutlined />,
    href: '/agents'
  },
  {
    key: '/tools',
    label: 'Tools',
    icon: <ToolOutlined />,
    href: '/tools'
  },
  {
    key: '/integrations',
    label: 'Integrations',
    icon: <ApiOutlined />,
    href: '/integrations'
  },
  {
    key: '/settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    href: '/settings'
  },
]

export function Navigation({ collapsed = false }: NavigationProps) {
  const location = useLocation()

  // Find the currently active key
  const activeKey = navigation.find(item =>
    location.pathname === item.href ||
    (item.href !== '/' && location.pathname.startsWith(item.href))
  )?.key || '/'

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = navigation.find(nav => nav.key === key)
    if (item) {
      // Use Link navigation instead of direct window.location
      window.location.href = item.href
    }
  }

  return (
    <div className="p-4">
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '14px',
          fontWeight: 500,
        }}
        items={navigation.map(item => ({
          key: item.key,
          icon: item.icon,
          label: (
            <Link
              to={item.href}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                width: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {item.label}
            </Link>
          ),
        }))}
      />
    </div>
  )
}