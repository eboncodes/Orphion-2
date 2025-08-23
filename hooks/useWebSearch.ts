import { useState } from 'react'
import { orphionAIService } from '@/app/services/OrphionAIService'

export interface SearchResults {
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

  return {
    searchResults,
    isSearching,
    searchWeb
  }
} 