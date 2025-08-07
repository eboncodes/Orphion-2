"use client"

import React, { useState, useEffect, useRef } from "react"

import { Search, X, ArrowUp, ArrowDown, PencilLine, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

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
}

interface SearchResult {
  conversationId: string
  conversationTitle: string
  messageContent: string
  sender: 'user' | 'ai'
  timestamp: Date
  matchIndex: number
  matchLength: number
}

interface ChatSearchProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  onJumpToConversation: (conversationId: string) => void
}

export default function ChatSearch({ 
  isOpen, 
  onClose, 
  conversations, 
  onJumpToConversation 
}: ChatSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Handle search
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

      conversations.forEach((conversation) => {
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
            matchLength: query.length
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
              matchLength: query.length
            })
            
            matchIndex = content.indexOf(query, matchIndex + 1)
          }
        })
      })

      setSearchResults(results)
      setSelectedIndex(0)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, conversations])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          onJumpToConversation(searchResults[selectedIndex].conversationId)
          onClose()
        }
        break
    }
  }

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
                placeholder="Search tasks..."
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
                  No conversations found for "{searchQuery}"
                </div>
              ) : searchQuery.trim() && searchResults.length > 0 ? (
                <div>
                  {/* New task option */}
                  <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg border-b border-gray-100">
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
                     {searchResults.slice(0, 5).map((result, index) => (
                       <div
                         key={`${result.conversationId}-${result.matchIndex}-${index}`}
                         className={`p-3 cursor-pointer transition-colors rounded-lg ${
                           index === selectedIndex 
                             ? 'bg-blue-50' 
                             : 'hover:bg-gray-50'
                         }`}
                         onClick={() => {
                           onJumpToConversation(result.conversationId)
                           onClose()
                         }}
                       >
                         <div className="flex items-start space-x-3">
                           <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                             <MessageSquare className="w-5 h-5 text-gray-600" />
                           </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                              {result.conversationTitle}
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
                    ))}
                  </div>
                </div>
              ) : (
                                 <div className="p-4">
                   {/* New task option when no search */}
                   <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg border-b border-gray-100">
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
                     {conversations.slice(0, 3).map((conversation, index) => (
                       <div
                         key={conversation.id}
                         className="p-3 cursor-pointer transition-colors rounded-lg hover:bg-gray-50"
                         onClick={() => {
                           onJumpToConversation(conversation.id)
                           onClose()
                         }}
                       >
                         <div className="flex items-start space-x-3">
                           <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                             <MessageSquare className="w-5 h-5 text-gray-600" />
                           </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                              {conversation.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {conversation.messages.length > 0 
                                ? conversation.messages[0].content.substring(0, 50) + '...'
                                : 'No messages yet'
                              }
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 flex-shrink-0">
                            {formatTime(conversation.updatedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
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