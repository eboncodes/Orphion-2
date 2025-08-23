"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { 
  PencilLine, 
  Search, 
  PanelLeftOpen, 
  Settings, 
  Trash2, 
  MessageSquare, 
  Heart, 
  ChevronRight, 
  Home, 
  Tablet, 
  Sliders, 
  MoreVertical, 
  Edit3,
  Star,
  ExternalLink,
  User,
  // Add more Lucide icons for dynamic conversation icons
  Code,
  Cpu,
  Database,
  Terminal,
  Bug,
  GitBranch,
  BookOpen,
  GraduationCap,
  Brain,
  Target,
  Palette,
  Music,
  Camera,
  Film,
  PenTool,
  Brush,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChartBar,
  Calculator,
  Activity,
  Dumbbell,
  Leaf,
  Sun,
  Moon,
  Plane,
  Car,
  Train,
  MapPin,
  Globe,
  Compass,
  Utensils,
  ChefHat,
  Coffee,
  Wine,
  Apple,
  Carrot,
  Trees,
  Mountain,
  Cloud,
  Flower,
  Phone,
  Mail,
  Users,
  Wrench,
  Hammer,
  Shield,
  Lock,
  Key,
  Rocket,
  FlaskConical,
  Dna,
  Puzzle,
  Gem,
  Gift,
  Crown,
  Anchor,
  Bell,
  Calendar,
  Clock,
  CreditCard,
  ShoppingCart,
  Sparkles,
  Telescope,
  Scissors,
  Mic,
  Type,
  MousePointerClick,
  Laptop,
  Speaker,
  Headphones,
  Gamepad,
    ThumbsUp, 
  ThumbsDown,
  Loader2,
  Smile,
  Frown,
  Handshake,
  Clipboard,
  Folder,
  FileText,
  Image,
  PieChart,
  Book,
  Map
} from "lucide-react"
import Tooltip from "@/components/ui/tooltip"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import ChatSearch from "../chat/ChatSearch"
import { 
  ChatConversation, 
  getConversations, 
  deleteConversation,
  clearAllConversations,
  saveConversations
} from "@/lib/chat-storage"
import { 
  PageConversation, 
  getPageConversations, 
  deletePageConversation,
  clearAllPageConversations
} from "@/lib/page-storage"
import Link from "next/link"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  onSettings: () => void
  onLoadConversation?: (conversation: ChatConversation | PageConversation) => void
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
  const { toast } = useToast()
  const { isAuthenticated, setShowSignInModal, setShowSignUpModal, user } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [pageConversations, setPageConversations] = useState<PageConversation[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below')
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 })
  const [favorites, setFavorites] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'recent' | 'pages'>('all')
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')
  const [isCreatingPage, setIsCreatingPage] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  // Ensure the creating-task indicator clears when conversation context changes
  useEffect(() => {
    if (isCreatingTask) {
      setIsCreatingTask(false)
    }
  }, [currentConversationId])

  // Load conversations from localStorage
  useEffect(() => {
    const loadConversations = () => {
      const savedConversations = getConversations()
      console.log('Sidebar: Loading conversations:', savedConversations.length)
      setConversations(savedConversations)
    }
    
    const loadPageConversations = () => {
      const savedPageConversations = getPageConversations()
      console.log('Sidebar: Loading page conversations:', savedPageConversations.length)
      setPageConversations(savedPageConversations)
    }
    
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem('orphion_favorites')
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    }
    
    loadConversations()
    loadPageConversations()
    loadFavorites()
    
    // Listen for storage changes (when conversations are updated in other components)
    const handleStorageChange = () => {
      loadConversations()
      loadPageConversations()
    }
    
    // Also listen for custom events when conversations are updated
    const handleConversationUpdate = () => {
      loadConversations()
    }
    
    // Listen for page conversation updates
    const handlePageConversationUpdate = () => {
      loadPageConversations()
    }
    
    // Listen for favorites updates from other components
    const handleFavoritesUpdate = () => {
      loadFavorites()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('conversation-updated', handleConversationUpdate)
    window.addEventListener('page-conversation-updated', handlePageConversationUpdate)
    window.addEventListener('favorites-updated', handleFavoritesUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('conversation-updated', handleConversationUpdate)
      window.removeEventListener('page-conversation-updated', handlePageConversationUpdate)
      window.removeEventListener('favorites-updated', handleFavoritesUpdate)
    }
  }, [])

  // Function to render dynamic conversation icons
  const renderConversationIcon = (iconName?: string, isActive: boolean = false) => {
    if (!iconName) {
      console.log('No icon name provided, using default MessageSquare')
      return <MessageSquare className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
    }
    
    console.log('Rendering icon:', iconName, 'isActive:', isActive)
    
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
      Wrench, Hammer, Shield, Lock, Key, Rocket, FlaskConical,
      Dna, Puzzle, Gem, Gift, Crown, Anchor, Bell, Calendar,
      Clock, CreditCard, ShoppingCart, Sparkles, Telescope,
      Scissors, Mic, Type, MousePointerClick, Laptop,
      Speaker, Headphones, Gamepad, ThumbsUp, ThumbsDown,
      Smile, Frown, Handshake, Clipboard, Folder, FileText,
      Image, PieChart, Book, Map
    }
    
    const IconComponent = iconMap[iconName]
    if (IconComponent) {
      console.log('Icon component found:', iconName)
      return <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
    }
    
    console.log('Icon component not found, using fallback MessageSquare')
    // Fallback to default icon if icon name not found
    return <MessageSquare className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
  }

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

  const handleLoadConversation = (conversation: ChatConversation | PageConversation) => {
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
    
    // Check if it's a page conversation
    const isPageConversation = pageConversations.some(conv => conv.id === conversationToDelete)
    
    if (isPageConversation) {
      // Delete page conversation
      deletePageConversation(conversationToDelete)
      setPageConversations(prev => prev.filter(conv => conv.id !== conversationToDelete))
      
      // If we're currently viewing the deleted page, redirect to dashboard
      if (currentConversationId === conversationToDelete) {
        console.log('Sidebar: Redirecting to dashboard after deleting current page')
        window.location.href = '/dashboard'
      }
      
      // Show success toast
      toast({
        variant: "success",
        title: "Page deleted",
      })
    } else {
      // Delete chat conversation
      deleteConversation(conversationToDelete)
      setConversations(prev => prev.filter(conv => conv.id !== conversationToDelete))
      
      // If we're currently viewing the deleted conversation, redirect to dashboard
      if (currentConversationId === conversationToDelete) {
        console.log('Sidebar: Redirecting to dashboard after deleting current conversation')
        // Trigger new chat to clear the current state
        onNewChat()
        // Ensure any pending creating state is cleared
        setIsCreatingTask(false)
      }
      
      // Show success toast
      toast({
        variant: "success",
        title: "Chat deleted",
      })
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

  const handleJumpToConversation = (conversationId: string, type: 'chat' | 'page') => {
    if (type === 'page') {
      const pageConversation = pageConversations.find(conv => conv.id === conversationId)
      if (pageConversation) {
        onLoadConversation?.(pageConversation)
      }
    } else {
      const conversation = conversations.find(conv => conv.id === conversationId)
      if (conversation) {
        onLoadConversation?.(conversation)
      }
    }
  }



  const handleRename = (conversationId: string) => {
    // Check if it's a page conversation
    const pageConversation = pageConversations.find(conv => conv.id === conversationId)
    if (pageConversation) {
      setEditingConversationId(conversationId)
      setEditingTitle(pageConversation.title)
      return
    }
    
    // Check if it's a chat conversation
    const chatConversation = conversations.find(conv => conv.id === conversationId)
    if (chatConversation) {
      setEditingConversationId(conversationId)
      setEditingTitle(chatConversation.title)
    }
  }

  const handleSaveRename = () => {
    if (editingConversationId && editingTitle.trim()) {
      // Check if it's a page conversation
      const isPageConversation = pageConversations.some(conv => conv.id === editingConversationId)
      
      if (isPageConversation) {
        // Update the page conversation title in localStorage
        import('@/lib/page-storage').then(({ getPageConversations, savePageConversations }) => {
          const pageConversations = getPageConversations()
          const conversation = pageConversations.find(conv => conv.id === editingConversationId)
          if (conversation) {
            conversation.title = editingTitle.trim()
            conversation.updatedAt = new Date()
            savePageConversations(pageConversations)
            
            // Update local state
            setPageConversations(prev => prev.map(conv => 
              conv.id === editingConversationId 
                ? { ...conv, title: editingTitle.trim(), updatedAt: new Date() }
                : conv
            ))
          }
        })
      } else {
        // Update the chat conversation title in localStorage
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
    }
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleCancelRename = () => {
    setEditingConversationId(null)
    setEditingTitle('')
  }

  const handleToggleFavorite = (conversationId: string) => {
    const isAdding = !favorites.includes(conversationId)
    const newFavorites = isAdding
      ? [...favorites, conversationId]
      : favorites.filter(id => id !== conversationId)
    
    setFavorites(newFavorites)
    localStorage.setItem('orphion_favorites', JSON.stringify(newFavorites))
    
    // Show success toast
    toast({
      variant: "success",
      title: isAdding ? 'Added to favorites' : 'Removed from favorites',
    })
  }

  const handleOpenInNewTab = (conversationId: string) => {
    // Check if it's a page conversation
    const pageConversation = pageConversations.find(conv => conv.id === conversationId)
    if (pageConversation) {
      // Create a URL for page conversation
      const url = `${window.location.origin}/pages?page=${conversationId}`
      window.open(url, '_blank')
      return
    }
    
    // Check if it's a chat conversation
    const chatConversation = conversations.find(conv => conv.id === conversationId)
    if (chatConversation) {
      // Create a URL for chat conversation
      const url = `${window.location.origin}/dashboard?conversation=${conversationId}`
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

  // Helper function to clean markdown formatting from text
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/^#+\s*/gm, '') // Remove headers (# ## ### etc)
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold (**text**)
      .replace(/\*(.*?)\*/g, '$1') // Remove italic (*text*)
      .replace(/`(.*?)`/g, '$1') // Remove inline code (`text`)
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough (~~text~~)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links ([text](url))
      .replace(/^\s*[-*+]\s*/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered list markers
      .replace(/\n+/g, ' ') // Replace multiple newlines with single space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
  }

  // Helper function to generate profile icon based on email
  const getProfileIcon = (email: string) => {
    const firstLetter = email.charAt(0).toUpperCase()
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const colorIndex = email.charCodeAt(0) % colors.length
    return { letter: firstLetter, color: colors[colorIndex] }
  }

  return (
    <div
      data-sidebar
      className={`${isOpen ? "w-80" : "w-0"} border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden md:relative fixed top-0 left-0 h-full z-50 md:z-auto rounded-r-3xl shadow-lg`}
      style={{ backgroundColor: '#ededeb' }}
      onMouseEnter={onMouseEnter}
    >
      <div className="w-80 flex flex-col h-full">
        {/* Login Warning - Show when not authenticated */}
        {!isAuthenticated && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-6">
              <img 
                src="/ophion-icon-black.png" 
                alt="Orphion" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Welcome to Orphion</h3>
            <p className="text-sm text-gray-600 mb-8 max-w-xs leading-relaxed">
              Sign in to see your chat history and access all your conversations.
            </p>
            
            <div className="space-y-3 w-full max-w-xs">
              <button
                onClick={() => setShowSignInModal(true)}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignUpModal(true)}
                className="w-full px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium shadow-sm"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Main Sidebar Content - Show only when authenticated */}
        {isAuthenticated && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Tooltip content={isDocked ? 'Undock' : 'Dock'} position="bottom">
                <button
                  onClick={onToggleDock}
                  className={`p-2 rounded transition-colors ${
                    isDocked 
                      ? 'text-blue-600 hover:text-blue-700' 
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  <PanelLeftOpen className={`w-5 h-5 ${isDocked ? 'rotate-180' : ''}`} />
                </button>
              </Tooltip>
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
          <div className="mb-2">
            <div
              className="flex items-center justify-between w-full bg-white hover:bg-gray-50 transition-all duration-200 rounded-[20px] px-4 py-3 cursor-pointer border border-gray-200"
              onClick={() => {
                setIsCreatingTask(true)
                setTimeout(() => {
                  onNewChat()
                  // Clear spinner shortly after initiating new chat
                  setTimeout(() => setIsCreatingTask(false), 300)
                }, 100)
              }}
            >
              <div className="flex items-center">
                {isCreatingTask ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-500" />
                ) : (
                  <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-700">{isCreatingTask ? 'Creating task...' : 'New task'}</span>
              </div>
            </div>
          </div>

          {/* New Page Button */}
          <div className="mb-4">
            <div 
              onClick={() => {
                setIsCreatingPage(true)
                // Navigate to pages after a brief delay to show the loading state
                setTimeout(() => {
                  window.location.href = '/pages'
                }, 100)
              }}
              className="flex items-center justify-between w-full bg-white hover:bg-gray-50 transition-all duration-200 rounded-[20px] px-4 py-3 cursor-pointer border border-gray-200" 
            >
              <div className="flex items-center">
                {isCreatingPage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-500" />
                ) : (
                  <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {isCreatingPage ? 'Creating page...' : 'New page'}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-1">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 ${
                activeFilter === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('favorites')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 ${
                activeFilter === 'favorites' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Favourites
            </button>
            <button 
              onClick={() => setActiveFilter('recent')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 ${
                activeFilter === 'recent' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Recent
            </button>
            <button 
              onClick={() => setActiveFilter('pages')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 ${
                activeFilter === 'pages' 
                  ? 'bg-black text-white' 
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Pages
            </button>
          </div>
        </div>

        {/* Chats Section */}
        <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            {(() => {
              let filteredConversations: (ChatConversation | PageConversation)[] = []
              
              if (activeFilter === 'pages') {
                // Show only page conversations
                filteredConversations = pageConversations
              } else if (activeFilter === 'all') {
                // Show both chat and page conversations
                const filteredChatConversations = conversations
                const filteredPageConversations = pageConversations
                filteredConversations = [...filteredChatConversations, ...filteredPageConversations]
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              } else if (activeFilter === 'favorites') {
                // Show favorite conversations from both chat and page conversations
                const favoriteChatConversations = conversations.filter(conversation => 
                  favorites.includes(conversation.id)
                )
                const favoritePageConversations = pageConversations.filter(conversation => 
                  favorites.includes(conversation.id)
                )
                filteredConversations = [...favoriteChatConversations, ...favoritePageConversations]
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              } else if (activeFilter === 'recent') {
                // Show recent conversations from both chat and page conversations
                const thirtyMinutesAgo = new Date()
                thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)
                
                const recentChatConversations = conversations.filter(conversation => 
                  conversation.updatedAt > thirtyMinutesAgo
                )
                const recentPageConversations = pageConversations.filter(conversation => 
                  conversation.updatedAt > thirtyMinutesAgo
                )
                filteredConversations = [...recentChatConversations, ...recentPageConversations]
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              }

              if (filteredConversations.length === 0) {
                return (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                      {activeFilter === 'favorites' 
                        ? 'No favorite conversations yet' 
                        : activeFilter === 'recent'
                        ? 'No recent conversations'
                        : activeFilter === 'pages'
                        ? 'No pages yet'
                        : 'No conversations yet'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeFilter === 'favorites' 
                        ? 'Add conversations to favorites to see them here'
                        : activeFilter === 'recent'
                        ? 'Recent conversations will appear here'
                        : activeFilter === 'pages'
                        ? 'Create a new page to get started'
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
                      // Check if this is a page conversation by checking iconName
                      if ('iconName' in conversation && conversation.iconName === 'FileText') {
                        // This is a page conversation, redirect to pages
                        window.location.href = `/pages?page=${conversation.id}`
                      } else {
                        // This is a chat conversation, use the normal handler
                        handleLoadConversation(conversation)
                      }
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
                        {renderConversationIcon(
                          'iconName' in conversation ? conversation.iconName : conversation.icon, 
                          currentConversationId === conversation.id
                        )}
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
                              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                            {conversation.title}
                          </h4>
                        )}
                        <p className="text-xs text-gray-500 truncate pr-16">
                          {conversation.messages.length > 0 
                            ? (() => {
                                // Find the latest AI message for preview
                                const latestAIMessage = conversation.messages
                                  .slice()
                                  .reverse()
                                  .find(msg => msg.sender === 'ai')
                                
                                if (latestAIMessage) {
                                  // Clean markdown and use shorter limit for AI messages
                                  const cleanedContent = cleanMarkdown(latestAIMessage.content)
                                  return cleanedContent.substring(0, 35) + '...'
                                } else {
                                  // Fallback to first message if no AI message found
                                  const cleanedContent = cleanMarkdown(conversation.messages[0].content)
                                  return cleanedContent.substring(0, 50) + '...'
                                }
                              })()
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
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition-all duration-200"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeDropdown === conversation.id && (
                          <div
                            className="fixed w-48 bg-white border border-gray-200 rounded-3xl shadow-lg z-[9999] dropdown-menu"
                            style={{
                              left: dropdownCoords.x,
                              top: dropdownCoords.y
                            }}
                          >
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRename(conversation.id)
                                  setActiveDropdown(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:rounded-2xl flex items-center justify-start transition-all duration-200"
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
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:rounded-2xl flex items-center justify-start transition-all duration-200"
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
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:rounded-2xl flex items-center justify-start transition-all duration-200"
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
                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:rounded-2xl flex items-center justify-start transition-all duration-200"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tooltip content="Home">
                <button className="p-2 hover:bg-white rounded-xl transition-colors">
                  <Home className="w-5 h-5 text-gray-600" />
                </button>
              </Tooltip>
              <Tooltip content="Settings">
                <button 
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                  onClick={onSettings}
                >
                  <Sliders className="w-5 h-5 text-gray-600" />
                </button>
              </Tooltip>
            </div>
            
            {/* Profile Component */}
            <Tooltip content={user?.email || "Profile"}>
              <button className="flex items-center space-x-2 p-2 hover:bg-white rounded-xl transition-colors">
                {user ? (
                  <>
                    {user.avatar_url ? (
                      // Show Google avatar if available
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={user.avatar_url} 
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to letter avatar if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className={`w-8 h-8 ${getProfileIcon(user.email).color} rounded-full flex items-center justify-center hidden`}>
                          <span className="text-sm font-semibold text-white">
                            {getProfileIcon(user.email).letter}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Fallback to letter avatar
                      <div className={`w-8 h-8 ${getProfileIcon(user.email).color} rounded-full flex items-center justify-center`}>
                        <span className="text-sm font-semibold text-white">
                          {getProfileIcon(user.email).letter}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate max-w-24">
                      {user.name || user.email}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">User</span>
                  </>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
          </>
        )}

      </div>

      {/* Confirmation Dialogs - Show only when authenticated */}
      {isAuthenticated && (
        <>
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
            pageConversations={pageConversations}
            onJumpToConversation={handleJumpToConversation}
            onNewChat={onNewChat}
          />
        </>
      )}
    </div>
  )
} 