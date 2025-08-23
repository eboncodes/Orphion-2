"use client"

import { useState, useEffect } from "react"
import { Sliders, Globe, Feather, Wand2, Image } from "lucide-react"

interface ToolSelectorProps {
  selectedTool: 'study' | null
  onToolSelect: (tool: 'study' | null) => void
  onRemoveTool: () => void
}

export default function ToolSelector({ selectedTool, onToolSelect, onRemoveTool }: ToolSelectorProps) {
  const [showTools, setShowTools] = useState(false)
  const [shouldOpenUp, setShouldOpenUp] = useState(false)

  // Check if dropdown should open upward
  const checkDropdownPosition = () => {
    const button = document.querySelector('.tools-dropdown') as HTMLElement
    if (button) {
      const rect = button.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 200 // Approximate height of dropdown
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      setShouldOpenUp(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight)
    }
  }

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTools && !(event.target as Element).closest('.tools-dropdown')) {
        setShowTools(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTools])

  // Check position when opening dropdown
  useEffect(() => {
    if (showTools) {
      checkDropdownPosition()
    }
  }, [showTools])

  const handleToolSelect = (tool: 'study' | null) => {
    onToolSelect(tool)
    setShowTools(false)
  }

  const handleToggleTools = () => {
    setShowTools(!showTools)
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative tools-dropdown">
        <div 
          className="flex items-center justify-center w-8 h-8 cursor-pointer hover:bg-gray-100 rounded-md transition-colors"
          onClick={handleToggleTools}
        >
          <Sliders className="w-4 h-4 text-gray-500" />
        </div>
        
        {/* Tools Dropdown */}
        {showTools && (
          <div 
            className={`absolute left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-10 tools-dropdown ${
              shouldOpenUp ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
              <div className="text-xs text-gray-500 mb-2 px-2 flex items-center">
                <Sliders className="w-3 h-3 mr-1" />
                Tools
              </div>
              <div className="space-y-1">

                <button
                  onClick={() => handleToolSelect('study')}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Feather className="w-4 h-4 text-gray-600" />
                  <span>Study</span>
                </button>

              </div>
          </div>
        )}
      </div>
      
      {/* Selected Tool Display */}
      {selectedTool && (
        <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Feather className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Study
          </span>
          <button
            onClick={onRemoveTool}
            className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
} 