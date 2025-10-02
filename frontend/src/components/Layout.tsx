import { ReactNode } from 'react'
import { Navigation } from './Navigation'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  )
}