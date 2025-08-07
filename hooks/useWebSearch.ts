import { useState } from 'react'
import { orphionAIService } from '@/app/services/OrphionAIService'

interface SearchResults {
  answer: string
  sources: Array<{
    title: string
    url: string
    content: string
    score: number
    published_date?: string | null
  }>
  query: string
}

interface UseWebSearchReturn {
  searchResults: SearchResults | null
  isSearching: boolean
  searchWeb: (query: string) => Promise<SearchResults>
  shouldUseSearch: (message: string) => boolean
}

export function useWebSearch(): UseWebSearchReturn {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const searchWeb = async (query: string): Promise<SearchResults> => {
    setIsSearching(true)
    try {
      const results = await orphionAIService.searchWeb(query)
      setSearchResults(results)
      return results
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    } finally {
      setIsSearching(false)
    }
  }

  const shouldUseSearch = (message: string): boolean => {
    // Auto-detect if search is needed (for questions about current events, recent information, etc.)
    const searchKeywords = [
      'latest', 'recent', 'current', 'today', 'news', 'update', 
      '2024', '2023', 'trending', 'popular', 'what is', 'who is',
      'when did', 'where is', 'how to', 'best', 'top', 'latest news'
    ]
    
    const lowerMessage = message.toLowerCase()
    return searchKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  return {
    searchResults,
    isSearching,
    searchWeb,
    shouldUseSearch
  }
} 