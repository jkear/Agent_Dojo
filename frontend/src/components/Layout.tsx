import { ReactNode, useState } from 'react'
import { Layout as AntLayout, ConfigProvider } from 'antd'
import { Navigation } from './Navigation'
import { Header } from './Header'
import { macOSTheme, macOSCSS } from '../styles/macosTheme'

const { Content, Sider } = AntLayout

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ConfigProvider theme={macOSTheme}>
      <style dangerouslySetInnerHTML={{ __html: macOSCSS }} />
      <AntLayout className="min-h-screen macos-window">
        <Header
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
        <AntLayout>
          <Sider
            collapsed={collapsed}
            trigger={null}
            width={280}
            collapsedWidth={80}
            className="macos-sidebar macos-scrollbar"
            style={{
              background: '#F7F7F7',
              borderRight: '1px solid rgba(60, 60, 67, 0.36)',
            }}
          >
            <Navigation collapsed={collapsed} />
          </Sider>
          <AntLayout>
            <Content
              className="macos-scrollbar"
              style={{
                margin: 0,
                padding: 24,
                background: '#F5F5F7',
                minHeight: 'calc(100vh - 64px)',
              }}
            >
              <div className="macos-transition">
                {children}
              </div>
            </Content>
          </AntLayout>
        </AntLayout>
      </AntLayout>
    </ConfigProvider>
  )
}