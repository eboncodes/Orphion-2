"use client"

import React, { useState, useCallback } from "react"

interface ToolSelectorProps {
  onToolSelect: (tool: 'study' | null) => void
  onRemoveTool: () => void
  onModeChange?: (mode: 'auto' | 'agent' | 'chat') => void
}

export default function ToolSelector({
  onToolSelect,
  onRemoveTool,
  onModeChange
}: ToolSelectorProps) {
  const [selectedTool, setSelectedTool] = useState<'study' | null>(null)
  const [selectedMode, setSelectedMode] = useState<'auto' | 'agent' | 'chat'>('auto')

  // Handle tool selection
  const handleToolSelect = useCallback((tool: 'study' | null) => {
    setSelectedTool(tool)
    onToolSelect(tool)
  }, [onToolSelect])

  // Handle tool removal
  const handleRemoveTool = useCallback(() => {
    setSelectedTool(null)
    onRemoveTool()
  }, [onRemoveTool])

  // Handle mode change
  const handleModeChange = useCallback((mode: 'auto' | 'agent' | 'chat') => {
    setSelectedMode(mode)
    onModeChange?.(mode)
  }, [onModeChange])

  // Get tool description
  const getToolDescription = useCallback((tool: 'study') => {
    switch (tool) {

      case 'study':
        return 'Study mode for focused learning'
      default:
        return ''
    }
  }, [])

  // Get mode description
  const getModeDescription = useCallback((mode: 'auto' | 'agent' | 'chat') => {
    switch (mode) {
      case 'auto':
        return 'Automatic mode - AI chooses the best approach'
      case 'agent':
        return 'Agent mode - AI works autonomously on tasks'
      case 'chat':
        return 'Chat mode - Simple conversation'
      default:
        return ''
    }
  }, [])

  // Check if tool is active
  const isToolActive = useCallback((tool: 'study') => {
    return selectedTool === tool
  }, [selectedTool])

  // Check if mode is active
  const isModeActive = useCallback((mode: 'auto' | 'agent' | 'chat') => {
    return selectedMode === mode
  }, [selectedMode])

  return {
    selectedTool,
    selectedMode,
    handleToolSelect,
    handleRemoveTool,
    handleModeChange,
    getToolDescription,
    getModeDescription,
    isToolActive,
    isModeActive
  }
} 