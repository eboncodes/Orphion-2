"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PencilLine, Search, PanelLeftOpen, Settings, Trash2, MessageSquare, Heart, ChevronRight, Home, HelpCircle, Lightbulb, Tablet, Sliders, MoreVertical, Share2, Edit3, Star, ExternalLink } from "lucide-react"
import Tooltip from "@/components/ui/tooltip"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import ChatSearch from "./ChatSearch"
import { 
  ChatConversation, 
  getConversations, 
  deleteConversation,
  clearAllConversations,
  saveConversations
} from "@/lib/chat-storage"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  onSettings: () => void
  onLoadConversation?: (conversation: ChatConversation) => void
  currentConversationId?: string | null
  onMouseEnter?: () => void
  isDocked?: boolean
  onToggleDock?: () => void
}

export default function Sidebar({ 
  isOpen, 
  onToggle, 
  onNewChat, 
  onSettings, 
  onLoadConversation,
  currentConversationId,
  onMouseEnter,
  isDocked,
  onToggleDock
}: SidebarProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below')
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 })
  const [favorites, setFavorites] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent'>('all')
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')

  // Load conversations from localStorage
  useEffect(() => {
    const loadConversations = () => {
      const savedConversations = getConversations()
      console.log('Sidebar: Loading conversations:', savedConversations.length)
      setConversations(savedConversations)
    }
    
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem('orphion_favorites')
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    }
    
    loadConversations()
    loadFavorites()
    
    // Listen for storage changes (when conversations are updated in other components)
    const handleStorageChange = () => {
      loadConversations()
    }
    
    // Also listen for custom events when conversations are updated
    const handleConversationUpdate = () => {
      loadConversations()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('conversation-updated', handleConversationUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('conversation-updated', handleConversationUpdate)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.dropdown-menu')) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  const handleLoadConversation = (conversation: ChatConversation) => {
    onLoadConversation?.(conversation)
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversationToDelete(conversationId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteConversation = () => {
    if (!conversationToDelete) return
    
    console.log('Sidebar: Deleting conversation:', conversationToDelete)
    console.log('Sidebar: Current conversation ID:', currentConversationId)
    
    deleteConversation(conversationToDelete)
    setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete))
    
    // If we're currently viewing the deleted conversation, redirect to dashboard
    if (currentConversationId === conversationToDelete) {
      console.log('Sidebar: Redirecting to dashboard after deleting current conversation')
      // Trigger new chat to clear the current state
      onNewChat()
    }
    
    setConversationToDelete(null)
  }

  const handleClearAll = () => {
    setShowClearDialog(true)
  }

  const confirmClearAll = () => {
    clearAllConversations()
    setConversations([])
    
    // If we're currently viewing any conversation, redirect to dashboard
    if (currentConversationId) {
      onNewChat()
    }
  }

  // Search functionality
  const handleOpenSearch = () => {
    setIsSearchOpen(true)
  }

  const handleCloseSearch = () => {
    setIsSearchOpen(false)
  }

  const handleJumpToConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation) {
      onLoadConversation?.(conversation)
    }
  }

  const handleShare = (conversationId: string) => {
    // TODO: Implement share functionality
    console.log('Share conversation:', conversationId)
  }

  const handleRename = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation) {
      setEditingConversationId(conversationId)
      setEditingTitle(conversation.title)
    }
  }

  const handleSaveRename = () => {
    if (editingConversationId && editingTitle.trim()) {
      // Update the conversation title in localStorage
      const conversations = getConversations()
      const conversation = conversations.find(conv => conv.id === editingConversationId)
      if (conversation) {
        conversation.title = editingTitle.trim()
        conversation.updatedAt = new Date()
        saveConversations(conversations)
        
        // Update local state
        setConversations(prev => prev.map(conv => 
          conv.id === editingConversationId 
            ? { ...conv, title: editingTitle.trim(), updatedAt: new Date() }
            : conv
        ))
      }
    }
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleCancelRename = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleToggleFavorite = (conversationId: string) => {
    const newFavorites = favorites.includes(conversationId)
      ? favorites.filter(id => id !== conversationId)
      : [...favorites, conversationId]
    setFavorites(newFavorites)
    localStorage.setItem('orphion_favorites', JSON.stringify(newFavorites))
  }

  const handleOpenInNewTab = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation) {
      // Create a URL with the conversation ID as a parameter
      const url = `${window.location.origin}${window.location.pathname}?conversation=${conversationId}`
      window.open(url, '_blank')
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div
      data-sidebar
      className={`${isOpen ? "w-80" : "w-0"} border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden md:relative fixed top-0 left-0 h-full z-50 md:z-auto rounded-r-3xl shadow-lg`}
      style={{ backgroundColor: '#ededeb' }}
      onMouseEnter={onMouseEnter}
    >
      <div className="w-80 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-end mb-4">
            <div className="relative group">
              <Search 
                className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors" 
                onClick={handleOpenSearch}
              />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[60]">
                Search
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="mb-4">
            <div className="flex items-center justify-between w-full bg-white hover:bg-gray-50 transition-all duration-200 rounded-lg px-4 py-3 cursor-pointer border border-gray-200" onClick={onNewChat}>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-gray-700">New task</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Ctrl</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">K</span>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-1">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                activeFilter === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('favorites')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 max-w-[100px] ${
                activeFilter === 'favorites' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Favorites ({favorites.length})
            </button>
            <button 
              onClick={() => setActiveFilter('recent')}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                activeFilter === 'recent' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Recent ({(() => {
                const thirtyMinutesAgo = new Date()
                thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)
                return conversations.filter(conv => conv.updatedAt > thirtyMinutesAgo).length
              })()})
            </button>
          </div>
        </div>

        {/* Chats Section */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {(() => {
              const filteredConversations = conversations.filter(conversation => {
                if (activeFilter === 'favorites') {
                  return favorites.includes(conversation.id)
                } else if (activeFilter === 'recent') {
                  // Show conversations from last 30 minutes
                  const thirtyMinutesAgo = new Date()
                  thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)
                  return conversation.updatedAt > thirtyMinutesAgo
                }
                return true // Show all for 'all' filter
              })

              if (filteredConversations.length === 0) {
                return (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                      {activeFilter === 'favorites' 
                        ? 'No favorite conversations yet' 
                        : activeFilter === 'recent'
                        ? 'No recent conversations'
                        : 'No conversations yet'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeFilter === 'favorites' 
                        ? 'Add conversations to favorites to see them here'
                        : activeFilter === 'recent'
                        ? 'Recent conversations will appear here'
                        : 'Start a new task to get started'
                      }
                    </p>
                  </div>
                )
              }

              return filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  data-chat-id={conversation.id}
                  onClick={() => {
                    if (editingConversationId !== conversation.id) {
                      handleLoadConversation(conversation)
                    }
                  }}
                  className={`group relative p-3 cursor-pointer transition-all duration-200 hover:bg-white rounded-xl ${
                    currentConversationId === conversation.id ? 'bg-white' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="flex items-start space-x-3">
                      {/* Circular Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        currentConversationId === conversation.id ? 'bg-gray-800' : 'bg-gray-200'
                      }`}>
                        <MessageSquare className={`w-5 h-5 ${
                          currentConversationId === conversation.id ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {editingConversationId === conversation.id ? (
                          <div className="mb-1">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveRename()
                                } else if (e.key === 'Escape') {
                                  handleCancelRename()
                                }
                              }}
                              onBlur={handleSaveRename}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                            {conversation.title}
                          </h4>
                        )}
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.messages.length > 0 
                            ? conversation.messages[0].content.substring(0, 50) + '...'
                            : 'No messages yet'
                          }
                        </p>
                      </div>
                      
                      {/* 3-dot Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const isOpening = activeDropdown !== conversation.id
                            if (isOpening) {
                              // Calculate position when opening
                              const buttonRect = e.currentTarget.getBoundingClientRect()
                              const sidebarRect = e.currentTarget.closest('[data-sidebar]')?.getBoundingClientRect()
                              const bottomContainer = e.currentTarget.closest('[data-sidebar]')?.querySelector('[data-bottom-container]')?.getBoundingClientRect()
                              
                              if (sidebarRect) {
                                // Calculate available space, considering the bottom container
                                const availableSpaceBelow = bottomContainer 
                                  ? bottomContainer.top - buttonRect.bottom 
                                  : sidebarRect.bottom - buttonRect.bottom
                                const spaceAbove = buttonRect.top - sidebarRect.top
                                const menuHeight = 200 // Approximate menu height
                                
                                if (availableSpaceBelow < menuHeight && spaceAbove > menuHeight) {
                                  setDropdownPosition('above')
                                } else {
                                  setDropdownPosition('below')
                                }
                                
                                // Set dropdown coordinates
                                const x = buttonRect.right - 192 // 192px = w-48
                                const y = dropdownPosition === 'above' 
                                  ? buttonRect.top - 200 - 4 // menu height + margin
                                  : buttonRect.bottom + 4 // margin
                                
                                setDropdownCoords({ x, y })
                              }
                            }
                            setActiveDropdown(activeDropdown === conversation.id ? null : conversation.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all duration-200"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === conversation.id && (
                          <div 
                            className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] dropdown-menu"
                            style={{
                              left: dropdownCoords.x,
                              top: dropdownCoords.y
                            }}
                          >
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShare(conversation.id)
                                  setActiveDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-start"
                              >
                                <Share2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>Share</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRename(conversation.id)
                                  setActiveDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-start"
                              >
                                <Edit3 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleFavorite(conversation.id)
                                  setActiveDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-start"
                              >
                                <Star className={`w-4 h-4 mr-2 flex-shrink-0 ${favorites.includes(conversation.id) ? 'text-gray-600 fill-current' : ''}`} />
                                <span className="whitespace-nowrap">{favorites.includes(conversation.id) ? 'Remove from favorites' : 'Add to favorites'}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenInNewTab(conversation.id)
                                  setActiveDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-start"
                              >
                                <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>Open in new tab</span>
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteConversation(conversation.id, e)
                                  setActiveDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center justify-start"
                              >
                                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Timestamp at bottom right */}
                    <div className="absolute bottom-0 right-0 text-xs text-gray-400">
                      {formatDate(conversation.updatedAt)}
                    </div>
                  </div>
                </div>
              ))
            })()}
            </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-300 p-2" data-bottom-container>
          {/* Share Card */}
          <div className="mb-2 mt-1">
            <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-300 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-normal text-gray-900 font-radely">Share Orphion with a friend</h4>
                    <p className="text-xs text-gray-500">Get 500 credits each</p>
                  </div>
                </div>
                <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Tooltip content="Home">
              <button className="p-2 hover:bg-white rounded-xl transition-colors">
                <Home className="w-5 h-5 text-gray-600" />
              </button>
            </Tooltip>
            <Tooltip content="Help">
              <button className="p-2 hover:bg-white rounded-xl transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
            </Tooltip>
            <Tooltip content="Rules">
              <button className="p-2 hover:bg-white rounded-xl transition-colors">
                <Lightbulb className="w-5 h-5 text-gray-600" />
              </button>
            </Tooltip>
            <Tooltip content="Mobile">
              <button className="p-2 hover:bg-white rounded-xl transition-colors">
                <Tablet className="w-5 h-5 text-gray-600" />
              </button>
            </Tooltip>
            <Tooltip content="Settings">
              <button className="p-2 hover:bg-white rounded-xl transition-colors">
                <Sliders className="w-5 h-5 text-gray-600" />
              </button>
            </Tooltip>
          </div>
        </div>

      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteConversation}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={<Trash2 className="w-6 h-6 text-red-500" />}
      />

      <ConfirmDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={confirmClearAll}
        title="Clear All Conversations"
        message="Are you sure you want to delete all conversations? This action cannot be undone and will permanently remove all your chat history."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
        icon={<Trash2 className="w-6 h-6 text-red-500" />}
      />

      {/* Chat Search Popup */}
      <ChatSearch
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        conversations={conversations}
        onJumpToConversation={handleJumpToConversation}
      />
    </div>
  )
} 