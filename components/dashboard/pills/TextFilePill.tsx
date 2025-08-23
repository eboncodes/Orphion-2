import React, { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface TextFilePillProps {
  filename: string
  content: string
  sources?: Array<{
    title: string
    url: string
  }>
}

const TextFilePill: React.FC<TextFilePillProps> = ({ 
  filename, 
  content,
  sources = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

     return (
    <div className="inline-flex flex-col gap-2">
      {/* Main pill - always visible */}
      <div 
        className="inline-flex items-center gap-2 rounded-xl bg-gray-100 border border-gray-300 px-3 py-2 text-sm shadow-sm cursor-pointer w-fit"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* File icon container to resemble OS file tile */}
        <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-gray-200 border border-gray-300">
          <FileText className="w-3.5 h-3.5 text-gray-600" />
        </span>
        <span className="font-medium text-gray-700 font-mono">
          {filename}
        </span>
                {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
     </div>

            {/* Dropdown content */}
      {isExpanded && (
                 <div className="bg-gray-50 border border-gray-300 rounded-2xl p-4 max-w-2xl font-mono">
          {/* File header */}
          <div className="bg-gray-200 rounded-t-lg -mt-4 -mx-4 px-4 py-2 mb-4 text-xs text-gray-600 font-mono flex items-center justify-between">
            <div className="truncate pr-2">
              {filename} • {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-gray-300/70 transition-colors"
              aria-label="Download text file"
              title="Download"
              onClick={(e) => {
                e.stopPropagation()
                try {
                  const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' })
                  const link = document.createElement('a')
                  link.href = URL.createObjectURL(blob)
                  link.download = filename || 'file.txt'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(link.href)
                } catch (err) {
                  console.error('Download failed', err)
                }
              }}
            >
              {/* Simple download icon (inline SVG to avoid adding new imports) */}
              <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
          
                      {/* Content section */}
           <div className="mb-4">
             {content ? (
               <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
             ) : (
               <p className="text-gray-500 text-sm italic">No content available</p>
             )}
           </div>

                    {/* Sources section - only show if sources exist */}
          {sources.length > 0 && (
            <div className="border-t border-gray-300 pt-4 mt-4">
              <div className="text-xs text-gray-500 mb-2 font-mono">REFERENCES:</div>
              <div className="space-y-1">
                {sources.slice(0, 5).map((source, index) => (
                  <div key={index} className="text-xs">
                    <span className="text-gray-400">[{index + 1}]</span>
                    <span className="ml-1 text-gray-700">{source.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
       </div>
     )}
   </div>
  )
}

export default TextFilePill
