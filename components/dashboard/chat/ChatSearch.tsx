"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"

import { Search, X, ArrowUp, ArrowDown, PencilLine, MessageSquare, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

// Import additional icons for dynamic conversation icons
import {
  Code, Cpu, Database, Terminal, Bug, GitBranch,
  BookOpen, GraduationCap, Brain, Target,
  Palette, Music, Camera, Film, PenTool, Brush,
  TrendingUp, DollarSign, Briefcase, ChartBar, Calculator,
  Activity, Dumbbell, Leaf, Sun, Moon,
  Plane, Car, Train, MapPin, Globe, Compass,
  Utensils, ChefHat, Coffee, Wine, Apple, Carrot,
  Trees, Mountain, Cloud, Flower,
  Phone, Mail, Users,
  Wrench, Hammer
} from "lucide-react"

interface Conversation {
  id: string
  title: string
  messages: Array<{
    id: string
    content: string
    sender: 'user' | 'ai'
    timestamp: Date
  }>
  createdAt: Date
  updatedAt: Date
  icon?: string
  iconName?: string
}

interface PageConversation {
  id: string
  title: string
  messages: Array<{
    id: string
    content: string
    sender: 'user' | 'ai'
    timestamp: Date
  }>
  createdAt: Date
  updatedAt: Date
  icon?: string
  iconName?: string
  pageContent?: string
}

interface SearchResult {
  conversationId: string
  conversationTitle: string
  messageContent: string
  sender: 'user' | 'ai'
  timestamp: Date
  matchIndex: number
  matchLength: number
  type: 'chat' | 'page'
}

interface ChatSearchProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  pageConversations: PageConversation[]
  onJumpToConversation: (conversationId: string, type: 'chat' | 'page') => void
  onNewChat: () => void
}

export default function ChatSearch({ 
  isOpen, 
  onClose, 
  conversations, 
  pageConversations,
  onJumpToConversation, 
  onNewChat 
}: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Memoize conversations to prevent unnecessary re-renders
  const memoizedConversations = useMemo(() => conversations, [conversations])
  const memoizedPageConversations = useMemo(() => pageConversations, [pageConversations])

  // Function to render dynamic conversation icons
  const renderConversationIcon = (iconName?: string, type: 'chat' | 'page' = 'chat') => {
    if (type === 'page') {
      return <FileText className="w-5 h-5 text-gray-600" />
    }
    
    if (!iconName) return <MessageSquare className="w-5 h-5 text-gray-600" />
    
    // Map icon names to Lucide icon components
    const iconMap: { [key: string]: any } = {
      Code, Cpu, Database, Terminal, Bug, GitBranch,
      BookOpen, GraduationCap, Brain, Target,
      Palette, Music, Camera, Film, PenTool, Brush,
      TrendingUp, DollarSign, Briefcase, ChartBar, Calculator,
      Activity, Dumbbell, Leaf, Sun, Moon,
      Plane, Car, Train, MapPin, Globe, Compass,
      Utensils, ChefHat, Coffee, Wine, Apple, Carrot,
      Trees, Mountain, Cloud, Flower,
      Phone, Mail, Users,
      Wrench, Hammer
    }
    
    const IconComponent = iconMap[iconName]
    if (IconComponent) {
      return <IconComponent className="w-5 h-5 text-gray-600" />
    }
    
    // Fallback to default icon if icon name not found
    return <MessageSquare className="w-5 h-5 text-gray-600" />
  }

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle search with optimized dependencies
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setSelectedIndex(0)
      return
    }

    setIsSearching(true)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      const query = searchQuery.toLowerCase()
      const results: SearchResult[] = []

      // Search in regular conversations
      memoizedConversations.forEach((conversation) => {
        // Search in conversation title
        const titleMatch = conversation.title.toLowerCase().indexOf(query)
        if (titleMatch !== -1) {
          results.push({
            conversationId: conversation.id,
            conversationTitle: conversation.title,
            messageContent: conversation.title,
            sender: 'user' as const,
            timestamp: conversation.updatedAt,
            matchIndex: titleMatch,
            matchLength: query.length,
            type: 'chat'
          })
        }

        // Search in conversation messages
        conversation.messages.forEach((message) => {
          const content = message.content.toLowerCase()
          let matchIndex = content.indexOf(query)
          
          while (matchIndex !== -1) {
            results.push({
              conversationId: conversation.id,
              conversationTitle: conversation.title,
              messageContent: message.content,
              sender: message.sender,
              timestamp: message.timestamp,
              matchIndex,
              matchLength: query.length,
              type: 'chat'
            })
            
            matchIndex = content.indexOf(query, matchIndex + 1)
          }
        })
      })

      // Search in page conversations
      memoizedPageConversations.forEach((conversation) => {
        // Search in conversation title
        const titleMatch = conversation.title.toLowerCase().indexOf(query)
        if (titleMatch !== -1) {
          results.push({
            conversationId: conversation.id,
            conversationTitle: conversation.title,
            messageContent: conversation.title,
            sender: 'user' as const,
            timestamp: conversation.updatedAt,
            matchIndex: titleMatch,
            matchLength: query.length,
            type: 'page'
          })
        }

        // Search in conversation messages
        conversation.messages.forEach((message) => {
          const content = message.content.toLowerCase()
          let matchIndex = content.indexOf(query)
          
          while (matchIndex !== -1) {
            results.push({
              conversationId: conversation.id,
              conversationTitle: conversation.title,
              messageContent: message.content,
              sender: message.sender,
              timestamp: message.timestamp,
              matchIndex,
              matchLength: query.length,
              type: 'page'
            })
            
            matchIndex = content.indexOf(query, matchIndex + 1)
          }
        })

        // Search in page content if available
        if (conversation.pageContent) {
          const pageContent = conversation.pageContent.toLowerCase()
          let matchIndex = pageContent.indexOf(query)
          
          while (matchIndex !== -1) {
            results.push({
              conversationId: conversation.id,
              conversationTitle: conversation.title,
              messageContent: conversation.pageContent!,
              sender: 'ai' as const,
              timestamp: conversation.updatedAt,
              matchIndex,
              matchLength: query.length,
              type: 'page'
            })
            
            matchIndex = pageContent.indexOf(query, matchIndex + 1)
          }
        }
      })

      setSearchResults(results)
      setSelectedIndex(0)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, memoizedConversations, memoizedPageConversations])

  // Memoize keyboard handlers to prevent unnecessary re-renders
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          const result = searchResults[selectedIndex]
          onJumpToConversation(result.conversationId, result.type)
          onClose()
        }
        break
    }
  }, [searchResults, selectedIndex, onJumpToConversation, onClose])

  // Memoize click handlers
  const handleJumpToConversationClick = useCallback((conversationId: string, type: 'chat' | 'page') => {
    onJumpToConversation(conversationId, type)
    onClose()
  }, [onJumpToConversation, onClose])

  // Highlight search term in text
  const highlightText = (text: string, matchIndex: number, matchLength: number) => {
    const before = text.slice(0, matchIndex)
    const match = text.slice(matchIndex, matchIndex + matchLength)
    const after = text.slice(matchIndex + matchLength)
    
    return (
      <>
        {before}
        <span className="bg-yellow-200 font-semibold">{match}</span>
        {after}
      </>
    )
  }

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid time'
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return 'Invalid time'
    }
  }

  // Format date
  const formatDate = (timestamp: Date) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 1) {
        return 'Just now'
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`
      } else if (diffInHours < 168) { // 7 days
        return `${Math.floor(diffInHours / 24)}d ago`
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <React.Fragment>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="flex items-center p-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations and pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 outline-none text-gray-900 placeholder-gray-500 text-base"
              />
              <button
                onClick={onClose}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No conversations or pages found for "{searchQuery}"
                </div>
              ) : searchQuery.trim() && searchResults.length > 0 ? (
                <div>
                  {/* New task option */}
                  <div 
                    className="p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg border-b border-gray-100"
                    onClick={() => {
                      onNewChat()
                      onClose()
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <PencilLine className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                          New task
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Start a new conversation
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        Ctrl K
                      </div>
                    </div>
                  </div>

                  {/* Today section */}
                  <div className="p-4 pt-2">
                    <div className="text-xs text-gray-500 mb-3 font-medium">Today</div>
                    {searchResults.slice(0, 5).map((result, index) => {
                      // Find the conversation to get its icon
                      const conversation = result.type === 'page' 
                        ? memoizedPageConversations.find(c => c.id === result.conversationId)
                        : memoizedConversations.find(c => c.id === result.conversationId)
                      
                      return (
                        <div
                          key={`${result.conversationId}-${result.matchIndex}-${index}`}
                          className={`p-3 cursor-pointer transition-colors rounded-lg ${
                            index === selectedIndex 
                              ? 'bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleJumpToConversationClick(result.conversationId, result.type)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              {renderConversationIcon(conversation?.iconName, result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {result.conversationTitle}
                                </div>
                                {result.type === 'page' && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Page
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.messageContent.length > 50 
                                  ? result.messageContent.substring(0, 50) + '...'
                                  : result.messageContent
                                }
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 flex-shrink-0">
                              {formatTime(result.timestamp)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {/* New task option when no search */}
                  <div 
                    className="p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg border-b border-gray-100"
                    onClick={() => {
                      onNewChat()
                      onClose()
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <PencilLine className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                          New task
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          Start a new conversation
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        Ctrl K
                      </div>
                    </div>
                  </div>

                  {/* Today section */}
                  <div className="p-4 pt-2">
                    <div className="text-xs text-gray-500 mb-3 font-medium">Today</div>
                    {/* Show recent conversations and pages */}
                    {[...memoizedConversations.slice(0, 2), ...memoizedPageConversations.slice(0, 1)]
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .slice(0, 3)
                      .map((conversation, index) => {
                        const isPage = 'pageContent' in conversation
                        return (
                          <div
                            key={conversation.id}
                            className="p-3 cursor-pointer transition-colors rounded-lg hover:bg-gray-50"
                            onClick={() => handleJumpToConversationClick(conversation.id, isPage ? 'page' : 'chat')}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                {renderConversationIcon(conversation.iconName, isPage ? 'page' : 'chat')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {conversation.title}
                                  </div>
                                  {isPage && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      Page
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 truncate pr-16">
                                  {conversation.messages.length > 0 
                                    ? (() => {
                                        // Find the latest AI message for preview
                                        const latestAIMessage = conversation.messages
                                          .slice()
                                          .reverse()
                                          .find(msg => msg.sender === 'ai')
                                        
                                        if (latestAIMessage) {
                                          // Use shorter limit for AI messages to prevent overlap with timestamp
                                          return latestAIMessage.content.substring(0, 35) + '...'
                                        } else {
                                          // Fallback to first message if no AI message found
                                          return conversation.messages[0].content.substring(0, 50) + '...'
                                        }
                                      })()
                                    : 'No messages yet'
                                  }
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 flex-shrink-0">
                                {formatTime(conversation.updatedAt)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
} 