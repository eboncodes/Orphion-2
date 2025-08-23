import React from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

interface PageCreationPillProps {
  pageTitle: string
  isProcessing: boolean
  isCompleted: boolean
  onClick?: () => void
}

const PageCreationPill: React.FC<PageCreationPillProps> = ({ 
  pageTitle, 
  isProcessing, 
  isCompleted,
  onClick
}) => {

  return (
    <div 
      className={`inline-flex items-center gap-2 rounded-xl bg-gray-100 border border-gray-300 px-3 py-2 text-sm shadow-sm ${onClick && isCompleted ? 'cursor-pointer' : ''}`}
      onClick={onClick && isCompleted ? onClick : undefined}
    >
      {isProcessing && !isCompleted && (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      )}
      {isCompleted && (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
      <span className="font-medium text-gray-600">
        {isCompleted ? 'Page ready' : 'Preparing page...'}
      </span>
    </div>
  )
}

export default PageCreationPill
