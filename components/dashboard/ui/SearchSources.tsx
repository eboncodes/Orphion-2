import React from 'react'
import { ExternalLink, Globe } from 'lucide-react'

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

  return (
    <div className="mt-4">
      {/* Sources Heading */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          Sources
        </h3>
      </div>

      {/* Compact source links */}
      <div className="flex flex-wrap gap-2">
        {sources.slice(0, 5).map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <img
              src={getFaviconUrl(source.url)}
              alt=""
              className="w-4 h-4 rounded-full flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <span className="truncate max-w-[140px]">
              {getDomainFromUrl(source.url)}
            </span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>
        ))}
      </div>
    </div>
  )
}

export default SearchSources 