import React from 'react'
import { X } from 'lucide-react'

interface InfoBlock {
  id: string
  content: string
}

interface InfoBlocksProps {
  title: string
  blocks: InfoBlock[]
  onRemove?: (id: string) => void
}

const InfoBlocks: React.FC<InfoBlocksProps> = ({ title, blocks, onRemove }) => {
  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {onRemove && (
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Blocks Container */}
      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: block.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }}
            />
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-gray-400 text-center">---</div>
      </div>
    </div>
  )
}

export default InfoBlocks 