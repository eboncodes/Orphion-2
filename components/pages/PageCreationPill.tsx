import React from 'react'
import { FileText, CheckCircle, Loader2 } from 'lucide-react'

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
      className={`inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-4 py-2.5 text-sm shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {isProcessing && !isCompleted && (
        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
      )}
      {isCompleted && (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
      {!isProcessing && !isCompleted && (
        <FileText className="w-4 h-4 text-green-600" />
      )}
      <span className="font-medium text-green-800">
        {isCompleted ? 'Prepared page' : 'Preparing page'}: {pageTitle}
      </span>
    </div>
  )
}

export default PageCreationPill
