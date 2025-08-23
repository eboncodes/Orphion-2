import React from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

interface TaskCreationPillProps {
  taskType: string
  taskQuery: string
  isProcessing: boolean
  isCompleted: boolean
}

const TaskCreationPill: React.FC<TaskCreationPillProps> = ({ 
  taskType, 
  taskQuery, 
  isProcessing, 
  isCompleted 
}) => {
  const getTaskLabel = (type: string) => {
    switch (type) {
      case 'web_search':
        return isCompleted ? 'Task created' : 'Creating task'
      default:
        return isCompleted ? 'Task created' : 'Creating task'
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
      {isProcessing && !isCompleted && (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      )}
      {isCompleted && (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
      <span className="font-medium text-gray-600">
        {getTaskLabel(taskType)}
      </span>
    </div>
  )
}

export default TaskCreationPill 