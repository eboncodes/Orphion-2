import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, ChevronRight } from 'lucide-react'

interface SearchSource {
  title: string
  url: string
  content: string
  score: number
  published_date?: string | null
}

interface SearchSourcesProps {
  sources: SearchSource[]
  query: string
}

const SearchSources: React.FC<SearchSourcesProps> = ({ sources, query }) => {
  const [showAllSources, setShowAllSources] = useState(false)
  
  const getDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return domain
    } catch {
      return 'unknown'
    }
  }

  const getFaviconUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return ''
    }
  }

  const formatDescription = (content: string): string => {
    // Remove markdown-style headers and clean up formatting
    return content
      .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Remove bold formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim()
  }

  if (!sources || sources.length === 0) {
    return null
  }

  // Always show max 3 sources on mobile, more on desktop
  const maxSources = 3
  const visibleSources = showAllSources ? sources : sources.slice(0, maxSources)
  const remainingCount = sources.length - maxSources

  return (
    <div className="mt-4">
      {/* Sources Heading */}
      <div className="text-sm text-gray-600 mb-3 font-medium">
        Sources
      </div>
      
      {/* Mobile: Rounded buttons without descriptions */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {visibleSources.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0"
            >
              <img
                src={getFaviconUrl(source.url)}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <span className="text-gray-700 text-xs truncate max-w-[120px]">
                {getDomainFromUrl(source.url)}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Desktop: Full cards with descriptions */}
      <div className="hidden md:block">
        <div className="flex items-start gap-3 overflow-x-auto">
          {visibleSources.map((source, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[240px] bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-2">
                <img
                  src={getFaviconUrl(source.url)}
                  alt=""
                  className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {getDomainFromUrl(source.url)}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  
                  <h4 className="text-xs font-medium text-gray-900 mb-1.5 line-clamp-2 leading-tight">
                    {source.title}
                  </h4>
                  
                  <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed">
                    {formatDescription(source.content)}
                  </p>
                  
                  {source.published_date && (
                    <div className="mt-1.5 text-xs text-gray-500">
                      {new Date(source.published_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Additional Sources Button for Desktop */}
          {!showAllSources && remainingCount > 0 && (
            <div className="flex-shrink-0 w-[240px] bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <button 
                onClick={() => setShowAllSources(true)}
                className="flex items-center justify-center h-full w-full text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                <span>+{remainingCount} more sources</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchSources 