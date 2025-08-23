import React from 'react'
import { CheckCircle, Loader2, ChevronDown } from 'lucide-react'

interface SearchRequestPillProps {
  searchQuery: string
  isSearching: boolean
  isCompleted: boolean
  isExpanded?: boolean
  onToggle?: () => void
}

const SearchRequestPill: React.FC<SearchRequestPillProps> = ({ 
  searchQuery, 
  isSearching, 
  isCompleted,
  isExpanded,
  onToggle
}) => {
  const showToggle = isCompleted && typeof onToggle === 'function'

  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm">
      {isSearching && !isCompleted && (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      )}
      {isCompleted && (
        <CheckCircle className="w-4 h-4 text-green-600" />
      )}
      <span className="font-medium text-gray-600">
        {isCompleted ? 'Search completed' : 'Searching...'}
      </span>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!!isExpanded}
          aria-label={isExpanded ? 'Hide search results' : 'Show search results'}
          className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
        >
          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

export default SearchRequestPill 