export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-xl text-primary">Agent Dojo</div>
          <div className="text-sm text-muted-foreground">
            AI Agent Orchestration Platform
          </div>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <button className="p-2 hover:bg-accent rounded-md">
            <span className="sr-only">Notifications</span>
            {/* Add notification icon */}
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary"></div>
            <span className="text-sm">User</span>
          </div>
        </div>
      </div>
    </header>
  )
}