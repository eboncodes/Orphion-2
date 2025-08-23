import { useState, useCallback, useEffect } from "react"
import { ChatConversation, getConversation } from "@/lib/chat-storage"
import { PageConversation, getPageConversation } from "@/lib/page-storage"

export function useDashboardState() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarDocked, setSidebarDocked] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [messages, setMessages] = useState<any[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState("New Chat")
  const [isFavorite, setIsFavorite] = useState(false)

  // Handle URL parameters for loading conversations
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation')
    
    if (conversationId) {
      // Import the getConversation function
      import('@/lib/chat-storage').then(({ getConversation }) => {
        const conversation = getConversation(conversationId)
        if (conversation) {
          console.log('Dashboard: Loading conversation from URL:', conversationId)
          setMessages(conversation.messages)
          setCurrentConversationId(conversation.id)
          setConversationTitle(conversation.title || "New Chat")
          setChatKey(prev => prev + 1)
        } else {
          console.log('Dashboard: Conversation not found:', conversationId)
          // Clear the URL parameter if conversation doesn't exist
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('conversation')
          window.history.replaceState({}, '', newUrl.toString())
        }
      })
    }
  }, [])

  const handleMessagesUpdate = useCallback((newMessages: any[]) => {
    setMessages(newMessages)
  }, [])

  const handleNewChat = useCallback(() => {
    console.log('Dashboard: Creating new chat')
    // Reset conversation state
    setCurrentConversationId(null)
    setMessages([])
    setConversationTitle("New Chat")
    
    // Force re-render of MessageBox with fresh state
    setChatKey(prev => prev + 1)
  }, [])

  const handleLoadConversation = useCallback((conversation: ChatConversation | PageConversation) => {
    if ('iconName' in conversation && conversation.iconName === 'FileText') {
      // This is a page conversation, redirect to pages
      window.location.href = `/pages?page=${conversation.id}`
      return
    }
    
    // This is a chat conversation
    setMessages(conversation.messages)
    setCurrentConversationId(conversation.id)
    setConversationTitle(conversation.title || "New Chat")
    // Force re-render of MessageBox with new conversation
    setChatKey(prev => prev + 1)
  }, [])

  const handleTitleGenerated = useCallback((title: string) => {
    setConversationTitle(title)
  }, [])

  const handleToggleDock = useCallback(() => {
    setSidebarDocked(!sidebarDocked)
  }, [sidebarDocked])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen)
  }, [sidebarOpen])

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleToggleSettings = useCallback(() => {
    console.log('Dashboard: Toggling settings, current state:', showSettings)
    setShowSettings(!showSettings)
  }, [showSettings])

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false)
  }, [])

  const handleToggleFavorite = useCallback(() => {
    if (!currentConversationId) return
    
    // Get current favorites from localStorage
    const savedFavorites = localStorage.getItem('orphion_favorites')
    const currentFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
    
    // Toggle favorite status
    const newFavorites = currentFavorites.includes(currentConversationId)
      ? currentFavorites.filter((id: string) => id !== currentConversationId)
      : [...currentFavorites, currentConversationId]
    
    // Save to localStorage
    localStorage.setItem('orphion_favorites', JSON.stringify(newFavorites))
    
    // Update local state
    setIsFavorite(newFavorites.includes(currentConversationId))
    
    // Dispatch custom event to notify sidebar
    window.dispatchEvent(new CustomEvent('favorites-updated'))
  }, [currentConversationId, isFavorite])

  // Check if current conversation is in favorites when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const savedFavorites = localStorage.getItem('orphion_favorites')
      const currentFavorites = savedFavorites ? JSON.parse(savedFavorites) : []
      setIsFavorite(currentFavorites.includes(currentConversationId))
    } else {
      setIsFavorite(false)
    }
  }, [currentConversationId])

  const handleConversationCreated = useCallback((conversationId: string) => {
    console.log('Conversation created:', conversationId)
    // Navigate to the newly created conversation
    setCurrentConversationId(conversationId)
    // Force re-render to load the conversation
    setChatKey(prev => prev + 1)
  }, [])

  const handleSetCloseTimeout = useCallback((timeout: NodeJS.Timeout | null) => {
    setCloseTimeout(timeout)
  }, [])

  // Sidebar hover handlers
  const handleSidebarHoverEnter = useCallback(() => {
    if (!sidebarOpen && !sidebarDocked) {
      setSidebarOpen(true)
    }
  }, [sidebarOpen, sidebarDocked])

  const handleSidebarHoverLeave = useCallback(() => {
    // Add a small delay before closing to make it more user-friendly
    if (sidebarOpen && !sidebarDocked) {
      const timeout = setTimeout(() => {
        setSidebarOpen(false)
      }, 300) // 300ms delay
      setCloseTimeout(timeout)
    }
  }, [sidebarOpen, sidebarDocked])

  return {
    // State
    sidebarOpen,
    sidebarDocked,
    closeTimeout,
    showSettings,
    chatKey,
    messages,
    currentConversationId,
    conversationTitle,
    isFavorite,
    
    // Handlers
    handleMessagesUpdate,
    handleNewChat,
    handleLoadConversation,
    handleTitleGenerated,
    handleToggleDock,
    handleToggleSidebar,
    handleCloseSidebar,
    handleToggleSettings,
    handleCloseSettings,
    handleToggleFavorite,
    handleConversationCreated,
    handleSetCloseTimeout,
    handleSidebarHoverEnter,
    handleSidebarHoverLeave
  }
} 