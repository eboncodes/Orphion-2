export interface PageMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  responseTime?: number
  attachedFile?: {
    file: File
    preview: string
    type: 'image' | 'document' | 'pdf' | 'excel' | 'csv'
    description?: string
  }
  isLiked?: boolean
  isDisliked?: boolean
  type?: 'page-content' | 'regular'
}

export interface PageConversation {
  id: string
  title: string
  messages: PageMessage[]
  createdAt: Date
  updatedAt: Date
  modelUsed?: string
  icon?: string
  iconName?: string
  pageContent?: string
}

const STORAGE_KEY = 'orphion_page_conversations'
const MAX_CONVERSATIONS = 20
const MAX_MESSAGES_PER_CONVERSATION = 100
const MAX_MESSAGE_LENGTH = 10000

// Helper function to serialize/deserialize dates
const serializeMessage = (message: PageMessage): any => ({
  ...message,
  content: message.content.length > MAX_MESSAGE_LENGTH 
    ? message.content.substring(0, MAX_MESSAGE_LENGTH) + '...' 
    : message.content,
  timestamp: message.timestamp.toISOString(),
  attachedFile: message.attachedFile ? {
    ...message.attachedFile,
    file: null // Don't serialize File objects
  } : undefined,
  generatedImages: undefined // Don't save images to storage
})

const deserializeMessage = (message: any): PageMessage => ({
  ...message,
  timestamp: new Date(message.timestamp),
  attachedFile: message.attachedFile ? {
    ...message.attachedFile,
    file: null // File objects can't be restored from localStorage
  } : undefined
})

const serializeConversation = (conversation: PageConversation): any => ({
  ...conversation,
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  messages: conversation.messages.map(serializeMessage)
})

const deserializeConversation = (conversation: any): PageConversation => ({
  ...conversation,
  createdAt: new Date(conversation.createdAt),
  updatedAt: new Date(conversation.updatedAt),
  messages: conversation.messages.map(deserializeMessage)
})

// Get all page conversations from localStorage
export const getPageConversations = (): PageConversation[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const conversations = JSON.parse(stored)
    return conversations.map(deserializeConversation)
  } catch (error) {
    console.error('Error loading page conversations from localStorage:', error)
    return []
  }
}

// Save all page conversations to localStorage
export const savePageConversations = (conversations: PageConversation[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    // Limit the number of conversations and messages to prevent localStorage overflow
    const limitedConversations = conversations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, MAX_CONVERSATIONS)
      .map(conv => ({
        ...conv,
        messages: conv.messages.slice(-MAX_MESSAGES_PER_CONVERSATION)
      }))
    
    const serialized = limitedConversations.map(serializeConversation)
    const serializedString = JSON.stringify(serialized)
    
    // Check if the data is too large
    if (serializedString.length > 5 * 1024 * 1024) { // 5MB limit
      console.warn('Page storage data too large, clearing old conversations')
      const emergencyConversations = conversations
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-50)
        }))
      
      const emergencySerialized = emergencyConversations.map(serializeConversation)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencySerialized))
    } else {
      localStorage.setItem(STORAGE_KEY, serializedString)
    }
    
    // Dispatch custom event to notify components of page conversation updates
    window.dispatchEvent(new CustomEvent('page-conversation-updated'))
  } catch (error) {
    console.error('Error saving page conversations to localStorage:', error)
    try {
      const conversations = getPageConversations()
      const emergencyConversations = conversations
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-25)
        }))
      
      const emergencySerialized = emergencyConversations.map(serializeConversation)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencySerialized))
    } catch (emergencyError) {
      console.error('Emergency page storage cleanup failed:', emergencyError)
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

// Create a new page conversation
export const createPageConversation = (title?: string, modelUsed?: string): PageConversation => {
  const initialTitle = title || 'New Page'
  const conversation: PageConversation = {
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now().toString()}_${Math.random().toString(36).slice(2,10)}`,
    title: initialTitle,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    modelUsed,
    iconName: 'FileText' // Default paper icon for pages
  }
  
  const conversations = getPageConversations()
  conversations.unshift(conversation)
  savePageConversations(conversations)
  
  return conversation
}

// Get a specific page conversation by ID
export const getPageConversation = (id: string): PageConversation | null => {
  const conversations = getPageConversations()
  return conversations.find(conv => conv.id === id) || null
}

// Update a page conversation
export const updatePageConversation = (id: string, updates: Partial<PageConversation>): void => {
  const conversations = getPageConversations()
  const index = conversations.findIndex(conv => conv.id === id)
  
  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date()
    }
    savePageConversations(conversations)
  }
}

// Add a message to a page conversation
export const addMessageToPageConversation = async (conversationId: string, message: PageMessage): Promise<void> => {
  const conversations = getPageConversations()
  const conversation = conversations.find(conv => conv.id === conversationId)
  
  if (conversation) {
    conversation.messages.push(message)
    conversation.updatedAt = new Date()
    savePageConversations(conversations)
  }
}

// Update a specific message in a page conversation
export const updateMessageInPageConversation = (conversationId: string, messageId: string, updates: Partial<PageMessage>): void => {
  const conversations = getPageConversations()
  const conversation = conversations.find(conv => conv.id === conversationId)
  
  if (conversation) {
    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex !== -1) {
      conversation.messages[messageIndex] = {
        ...conversation.messages[messageIndex],
        ...updates
      }
      conversation.updatedAt = new Date()
      savePageConversations(conversations)
    }
  }
}

// Delete a page conversation
export const deletePageConversation = (id: string): void => {
  const conversations = getPageConversations()
  const filtered = conversations.filter(conv => conv.id !== id)
  savePageConversations(filtered)
}

// Clear all page conversations
export const clearAllPageConversations = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// Get the most recent page conversation
export const getMostRecentPageConversation = (): PageConversation | null => {
  const conversations = getPageConversations()
  return conversations.length > 0 ? conversations[0] : null
}

// Check if there are any saved page conversations
export const hasSavedPageConversations = (): boolean => {
  const conversations = getPageConversations()
  return conversations.length > 0
}

// Get storage usage information for pages
export const getPageStorageUsage = (): { used: number; available: number; percentage: number } => {
  if (typeof window === 'undefined') return { used: 0, available: 0, percentage: 0 }
  
  try {
    const conversations = getPageConversations()
    const serialized = conversations.map(serializeConversation)
    const dataSize = JSON.stringify(serialized).length
    
    const estimatedAvailable = 5 * 1024 * 1024 // 5MB
    const percentage = (dataSize / estimatedAvailable) * 100
    
    return {
      used: dataSize,
      available: estimatedAvailable,
      percentage: Math.min(percentage, 100)
    }
  } catch (error) {
    console.error('Error calculating page storage usage:', error)
    return { used: 0, available: 0, percentage: 0 }
  }
}

// Clean up old page conversations to free up space
export const cleanupPageStorage = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    const conversations = getPageConversations()
    const usage = getPageStorageUsage()
    
    if (usage.percentage > 80) {
      console.warn('Page storage usage high, cleaning up old conversations')
      
      const cleanedConversations = conversations
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-50)
        }))
      
      savePageConversations(cleanedConversations)
    }
  } catch (error) {
    console.error('Error during page storage cleanup:', error)
  }
}

// Export page conversation as JSON
export const exportPageConversation = (id: string): string | null => {
  const conversation = getPageConversation(id)
  if (!conversation) return null
  
  return JSON.stringify(conversation, null, 2)
}

// Import page conversation from JSON
export const importPageConversation = (jsonData: string): PageConversation | null => {
  try {
    const conversation = JSON.parse(jsonData)
    const deserialized = deserializeConversation(conversation)
    
    // Generate new ID to avoid conflicts
    deserialized.id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : `${Date.now().toString()}_${Math.random().toString(36).slice(2,10)}`
    deserialized.createdAt = new Date()
    deserialized.updatedAt = new Date()
    
    const conversations = getPageConversations()
    conversations.unshift(deserialized)
    savePageConversations(conversations)
    
    return deserialized
  } catch (error) {
    console.error('Error importing page conversation:', error)
    return null
  }
}
