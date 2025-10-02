import { PanelLeftOpen, PanelRightOpen, Download, Upload, Zap } from 'lucide-react'
import { Button } from '../ui/Button'

interface CanvasToolbarProps {
  isPaletteOpen: boolean
  setIsPaletteOpen: (open: boolean) => void
  isPropertiesOpen: boolean
  setIsPropertiesOpen: (open: boolean) => void
}

export function CanvasToolbar({
  isPaletteOpen,
  setIsPaletteOpen,
  isPropertiesOpen,
  setIsPropertiesOpen,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center space-x-2 bg-card border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsPaletteOpen(!isPaletteOpen)}
        title="Toggle Node Palette"
      >
        <PanelLeftOpen className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
        title="Toggle Properties Panel"
      >
        <PanelRightOpen className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        title="Import Template"
      >
        <Upload className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        title="Export Canvas"
      >
        <Download className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        title="Auto Layout"
      >
        <Zap className="w-4 h-4" />
      </Button>
    </div>
  )
}