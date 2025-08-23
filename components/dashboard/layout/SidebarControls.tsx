"use client"

import { PanelLeftOpen } from "lucide-react"
import Tooltip from "@/components/ui/tooltip"

interface SidebarControlsProps {
  sidebarOpen: boolean
  sidebarDocked: boolean
  onToggleSidebar: () => void
  onToggleDock: () => void
}

export default function SidebarControls({
  sidebarOpen,
  sidebarDocked,
  onToggleSidebar,
  onToggleDock
}: SidebarControlsProps) {
  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <div className="absolute top-4 left-4 z-50 transition-opacity duration-300 opacity-100">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded transition-colors hover:bg-gray-100"
          >
            <PanelLeftOpen className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Dock toggle button when sidebar is open */}
      {sidebarOpen && (
        <div className="absolute top-2 left-4 z-50 transition-opacity duration-300 opacity-100">
          <Tooltip content={sidebarDocked ? 'Undock' : 'Dock'} position="bottom">
            <button
              onClick={onToggleDock}
              className={`p-2 rounded transition-colors ${
                sidebarDocked 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <PanelLeftOpen className={`w-5 h-5 ${sidebarDocked ? 'rotate-180' : ''}`} />
            </button>
          </Tooltip>
        </div>
      )}
    </>
  )
} 