import { getAPIKeys } from '@/lib/api-keys'

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  responseTime?: number
  usedWebSearch?: boolean
  searchResults?: {
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
  attachedFile?: {
    file: File
    preview: string
    type: 'image' | 'document' | 'pdf' | 'excel' | 'csv'
    description?: string
  }
  isLiked?: boolean
  isDisliked?: boolean
  isPlayingTTS?: boolean
  generatedImage?: string
  isGeneratingImage?: boolean
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  modelUsed?: string
}

const STORAGE_KEY = 'orphion_chat_conversations'
const MAX_CONVERSATIONS = 20 // Reduced limit to prevent localStorage overflow
const MAX_MESSAGES_PER_CONVERSATION = 100 // Limit messages per conversation
const MAX_MESSAGE_LENGTH = 10000 // Limit message content length

// Helper function to serialize/deserialize dates
const serializeMessage = (message: ChatMessage): any => ({
  ...message,
  content: message.content.length > MAX_MESSAGE_LENGTH 
    ? message.content.substring(0, MAX_MESSAGE_LENGTH) + '...' 
    : message.content,
  timestamp: message.timestamp.toISOString(),
  attachedFile: message.attachedFile ? {
    ...message.attachedFile,
    file: null // Don't serialize File objects
  } : undefined
})

const deserializeMessage = (message: any): ChatMessage => ({
  ...message,
  timestamp: new Date(message.timestamp),
  attachedFile: message.attachedFile ? {
    ...message.attachedFile,
    file: null // File objects can't be restored from localStorage
  } : undefined
})

const serializeConversation = (conversation: ChatConversation): any => ({
  ...conversation,
  createdAt: conversation.createdAt.toISOString(),
  updatedAt: conversation.updatedAt.toISOString(),
  messages: conversation.messages.map(serializeMessage)
})

const deserializeConversation = (conversation: any): ChatConversation => ({
  ...conversation,
  createdAt: new Date(conversation.createdAt),
  updatedAt: new Date(conversation.updatedAt),
  messages: conversation.messages.map(deserializeMessage)
})

// Get all conversations from localStorage
export const getConversations = (): ChatConversation[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const conversations = JSON.parse(stored)
    return conversations.map(deserializeConversation)
  } catch (error) {
    console.error('Error loading conversations from localStorage:', error)
    return []
  }
}

// Save all conversations to localStorage
export const saveConversations = (conversations: ChatConversation[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    // Limit the number of conversations and messages to prevent localStorage overflow
    const limitedConversations = conversations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by creation time, not update time
      .slice(0, MAX_CONVERSATIONS)
      .map(conv => ({
        ...conv,
        messages: conv.messages.slice(-MAX_MESSAGES_PER_CONVERSATION) // Keep only recent messages
      }))
    
    const serialized = limitedConversations.map(serializeConversation)
    const serializedString = JSON.stringify(serialized)
    
    // Check if the data is too large
    if (serializedString.length > 5 * 1024 * 1024) { // 5MB limit
      console.warn('Storage data too large, clearing old conversations')
      // Keep only the 5 most recent conversations
      const emergencyConversations = conversations
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by creation time
        .slice(0, 5)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-50) // Keep only 50 most recent messages
        }))
      
      const emergencySerialized = emergencyConversations.map(serializeConversation)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencySerialized))
    } else {
      localStorage.setItem(STORAGE_KEY, serializedString)
    }
    
    // Dispatch custom event to notify components of conversation updates
    window.dispatchEvent(new CustomEvent('conversation-updated'))
  } catch (error) {
    console.error('Error saving conversations to localStorage:', error)
    // If saving fails, try to clear some old data
    try {
      const conversations = getConversations()
      const emergencyConversations = conversations
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) // Sort by creation time
        .slice(0, 3)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-25) // Keep only 25 most recent messages
        }))
      
      const emergencySerialized = emergencyConversations.map(serializeConversation)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencySerialized))
    } catch (emergencyError) {
      console.error('Emergency storage cleanup failed:', emergencyError)
      // Last resort: clear everything
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

// Create a new conversation
export const createConversation = (title?: string, modelUsed?: string): ChatConversation => {
  const initialTitle = title || 'New Task'
  const conversation: ChatConversation = {
    id: Date.now().toString(),
    title: initialTitle,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    modelUsed
  }
  
  const conversations = getConversations()
  conversations.unshift(conversation) // Add to beginning
  saveConversations(conversations)
  
  return conversation
}

// Get a specific conversation by ID
export const getConversation = (id: string): ChatConversation | null => {
  const conversations = getConversations()
  return conversations.find(conv => conv.id === id) || null
}

// Update a conversation
export const updateConversation = (id: string, updates: Partial<ChatConversation>): void => {
  const conversations = getConversations()
  const index = conversations.findIndex(conv => conv.id === id)
  
  if (index !== -1) {
    conversations[index] = {
      ...conversations[index],
      ...updates,
      updatedAt: new Date()
    }
    saveConversations(conversations)
  }
}

// Generate numbered chat title
const generateNumberedTitle = (): string => {
  const conversations = getConversations()
  const chatCount = conversations.length + 1
  return `Chat ${chatCount}`
}

// Generate AI-powered chat title
const generateAIChatTitle = async (conversationId: string): Promise<void> => {
  try {
    const conversation = getConversation(conversationId)
    if (!conversation || conversation.messages.length < 4) return

    // Get the first user message to generate title from
    const userMessages = conversation.messages.filter(msg => msg.sender === 'user')
    const firstUserMessage = userMessages[0]
    
    if (!firstUserMessage) return
    
    // Create a simple title based on the first few words of the user message
    let title = firstUserMessage.content.substring(0, 50).trim()
    
    // If the message is too long, truncate and add ellipsis
    if (title.length >= 50) {
      title = title.substring(0, 47) + '...'
    }
    
    // If the title is too short, use a more descriptive approach
    if (title.length < 10) {
      title = `Chat about ${title}`
    }
    
    // Update the conversation title
    updateConversation(conversationId, { title })
    
  } catch (error) {
    console.error('Error generating AI chat title:', error)
    // Fallback to numbered title if AI generation fails
    const conversation = getConversation(conversationId)
    if (conversation) {
      updateConversation(conversationId, { title: generateNumberedTitle() })
    }
  }
}

// Add a message to a conversation
export const addMessageToConversation = async (conversationId: string, message: ChatMessage): Promise<void> => {
  const conversations = getConversations()
  const conversation = conversations.find(conv => conv.id === conversationId)
  
  if (conversation) {
    conversation.messages.push(message)
    conversation.updatedAt = new Date()
    
    // Generate AI title after the first AI response
    if (message.sender === 'ai' && conversation.messages.length === 4) {
      await generateAIChatTitle(conversationId)
    }
    
    saveConversations(conversations)
  }
}

// Update a specific message in a conversation
export const updateMessageInConversation = (conversationId: string, messageId: string, updates: Partial<ChatMessage>): void => {
  const conversations = getConversations()
  const conversation = conversations.find(conv => conv.id === conversationId)
  
  if (conversation) {
    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId)
    if (messageIndex !== -1) {
      conversation.messages[messageIndex] = {
        ...conversation.messages[messageIndex],
        ...updates
      }
      conversation.updatedAt = new Date()
      saveConversations(conversations)
    }
  }
}

// Delete a conversation
export const deleteConversation = (id: string): void => {
  const conversations = getConversations()
  const filtered = conversations.filter(conv => conv.id !== id)
  saveConversations(filtered)
}

// Clear all conversations
export const clearAllConversations = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// Get the most recent conversation
export const getMostRecentConversation = (): ChatConversation | null => {
  const conversations = getConversations()
  return conversations.length > 0 ? conversations[0] : null
}

// Check if there are any saved conversations
export const hasSavedConversations = (): boolean => {
  const conversations = getConversations()
  return conversations.length > 0
}

// Get storage usage information
export const getStorageUsage = (): { used: number; available: number; percentage: number } => {
  if (typeof window === 'undefined') return { used: 0, available: 0, percentage: 0 }
  
  try {
    const conversations = getConversations()
    const serialized = conversations.map(serializeConversation)
    const dataSize = JSON.stringify(serialized).length
    
    // Estimate available storage (localStorage is typically 5-10MB)
    const estimatedAvailable = 5 * 1024 * 1024 // 5MB
    const percentage = (dataSize / estimatedAvailable) * 100
    
    return {
      used: dataSize,
      available: estimatedAvailable,
      percentage: Math.min(percentage, 100)
    }
  } catch (error) {
    console.error('Error calculating storage usage:', error)
    return { used: 0, available: 0, percentage: 0 }
  }
}

// Clean up old conversations to free up space
export const cleanupStorage = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    const conversations = getConversations()
    const usage = getStorageUsage()
    
    if (usage.percentage > 80) {
      console.warn('Storage usage high, cleaning up old conversations')
      
      // Keep only the 10 most recent conversations with limited messages
      const cleanedConversations = conversations
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10)
        .map(conv => ({
          ...conv,
          messages: conv.messages.slice(-50) // Keep only 50 most recent messages
        }))
      
      saveConversations(cleanedConversations)
    }
  } catch (error) {
    console.error('Error during storage cleanup:', error)
  }
}

// Export conversation as JSON
export const exportConversation = (id: string): string | null => {
  const conversation = getConversation(id)
  if (!conversation) return null
  
  return JSON.stringify(conversation, null, 2)
}

// Import conversation from JSON
export const importConversation = (jsonData: string): ChatConversation | null => {
  try {
    const conversation = JSON.parse(jsonData)
    const deserialized = deserializeConversation(conversation)
    
    // Generate new ID to avoid conflicts
    deserialized.id = Date.now().toString()
    deserialized.createdAt = new Date()
    deserialized.updatedAt = new Date()
    
    const conversations = getConversations()
    conversations.unshift(deserialized)
    saveConversations(conversations)
    
    return deserialized
  } catch (error) {
    console.error('Error importing conversation:', error)
    return null
  }
}

 