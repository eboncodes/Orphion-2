"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Brain, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Custom filled bolt icons
const FilledBolt = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

const FilledBoltRed = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

export type ModelType = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'

interface ModelSelectorProps {
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
}

const models = [
  {
    id: 'gemini-2.5-flash' as ModelType,
    name: 'Gemini 2.5 Flash',
    description: 'For complex tasks',
    icon: FilledBoltRed,
    color: 'text-red-600'
  },
  {
    id: 'gemini-2.5-flash-lite' as ModelType,
    name: 'Gemini 2.5 Flash Lite', 
    description: 'For easier tasks',
    icon: FilledBolt,
    color: 'text-green-600'
  }
]

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldOpenUp, setShouldOpenUp] = useState(false)
  const selectedModelData = models.find(model => model.id === selectedModel) || models[0]
  const IconComponent = selectedModelData.icon

  // Check if dropdown should open upward
  const checkDropdownPosition = () => {
    const button = document.querySelector('.model-dropdown button') as HTMLElement
    if (button) {
      const rect = button.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 200 // Approximate height of dropdown
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      setShouldOpenUp(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.model-dropdown')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Check position when opening dropdown
  useEffect(() => {
    if (isOpen) {
      checkDropdownPosition()
    }
  }, [isOpen])

  return (
    <div className="relative model-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-3 text-sm font-medium text-gray-700 rounded-md flex items-center transition-colors ${
          isOpen ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <IconComponent className={`w-4 h-4 mr-2 ${selectedModelData.color}`} />
        {selectedModelData.name}
        <div>
          <ChevronDown className={`w-4 h-4 ml-2 text-gray-500 ${isOpen ? (shouldOpenUp ? 'rotate-180' : 'rotate-180') : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-10 ${
            shouldOpenUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
            <div className="text-xs text-gray-500 mb-2 px-2 flex items-center">
              <Brain className="w-3 h-3 mr-1" />
              Models
            </div>
            <div className="space-y-1">
              {models.map((model) => {
                const ModelIcon = model.icon
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <ModelIcon className={`w-4 h-4 ${model.color}`} />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-medium">{model.name}</span>
                      <span className="text-xs text-gray-500">{model.description}</span>
                    </div>
                  </button>
                )
              })}
            </div>
        </div>
      )}
    </div>
  )
} 