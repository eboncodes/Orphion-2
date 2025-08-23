import React from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

interface ImageGenerationPillProps {
  isGenerating: boolean
  isCompleted: boolean
}

const ImageGenerationPill: React.FC<ImageGenerationPillProps> = ({ isGenerating, isCompleted }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
      {isGenerating && !isCompleted && (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      )}
      {isCompleted && (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
      <span className="font-medium text-gray-600">
        {isCompleted ? 'Image generated' : 'Generating image…'}
      </span>
    </div>
  )
}

export default ImageGenerationPill

 
