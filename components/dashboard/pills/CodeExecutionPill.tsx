import React from 'react'
import { CheckCircle, Loader2, ChevronDown } from 'lucide-react'

interface CodeExecutionPillProps {
  code: string
  language?: string
  isExecuting: boolean
  isCompleted: boolean
  isExpanded?: boolean
  onToggle?: () => void
}

const CodeExecutionPill: React.FC<CodeExecutionPillProps> = ({ 
  code,
  language = 'python',
  isExecuting,
  isCompleted,
  isExpanded,
  onToggle
}) => {
  const showToggle = isCompleted && typeof onToggle === 'function'

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
      {isExecuting && !isCompleted && (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      )}
      {isCompleted && (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
      <span className="font-medium text-gray-600">
        {isCompleted ? 'Code executed' : 'Executing code'}
      </span>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!!isExpanded}
          aria-label={isExpanded ? 'Hide executed code' : 'Show executed code'}
          className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
        >
          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

export default CodeExecutionPill


