import { useState, useEffect, useRef } from 'react'
import { 
  ChatMessage, 
  createConversation, 
  getConversation, 
  updateConversation, 
  addMessageToConversation, 
  updateMessageInConversation,
  getMostRecentConversation,
  hasSavedConversations,
  cleanupStorage
} from '@/lib/chat-storage'

type Message = ChatMessage

interface UseConversationManagerProps {
  propCurrentConversationId?: string | null
  onMessagesUpdate: (messages: Message[]) => void
  onConversationCreated?: (conversationId: string) => void
}

export function useConversationManager({
  propCurrentConversationId,
  onMessagesUpdate,
  onConversationCreated
}: UseConversationManagerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isNewChatMode, setIsNewChatMode] = useState(false)

  // Load conversation from props or most recent conversation on mount
  useEffect(() => {
    console.log('useConversationManager: propCurrentConversationId changed to:', propCurrentConversationId)
    
    if (propCurrentConversationId) {
      // Load conversation from props (when user clicks on sidebar)
      const conversation = getConversation(propCurrentConversationId)
      if (conversation) {
        console.log('useConversationManager: Loading conversation:', conversation.id)
        setMessages(conversation.messages)
        setCurrentConversationId(conversation.id)
        setIsNewChatMode(false)
      }
    } else if (propCurrentConversationId === null) {
      // Explicitly clear conversation state when propCurrentConversationId is null
      console.log('useConversationManager: Clearing conversation state for new chat')
      setMessages([])
      setCurrentConversationId(null)
      setIsNewChatMode(true)
    } else if (propCurrentConversationId === undefined && hasSavedConversations() && messages.length === 0 && !isNewChatMode) {
      // Only load most recent conversation on initial mount, not when explicitly setting to null
      const mostRecent = getMostRecentConversation()
      if (mostRecent) {
        console.log('useConversationManager: Loading most recent conversation:', mostRecent.id)
        setMessages(mostRecent.messages)
        setCurrentConversationId(mostRecent.id)
      }
    }
  }, [propCurrentConversationId])



  const saveMessageToStorage = async (message: Message, conversationId?: string) => {
    const targetConversationId = conversationId || currentConversationId
    if (targetConversationId) {
      await addMessageToConversation(targetConversationId, message)
      // Clean up storage if needed
      cleanupStorage()
    }
  }

  const updateMessageInStorage = (messageId: string, updates: Partial<Message>) => {
    if (currentConversationId) {
      updateMessageInConversation(currentConversationId, messageId, updates)
    }
  }

  const createNewConversation = () => {
    console.log('Creating new conversation...')
    const newConversation = createConversation('New Chat', 'gemini-2.5-flash')
    console.log('New conversation created:', newConversation.id)
    setCurrentConversationId(newConversation.id)
    setIsNewChatMode(false)
    
    // Notify parent that conversation was created
    onConversationCreated?.(newConversation.id)
    
    return newConversation.id
  }

  const addMessage = (message: Message) => {
    setMessages(prev => {
      const newMessages = [...prev, message]
      // Call onMessagesUpdate after state update
      setTimeout(() => onMessagesUpdate(newMessages), 0)
      return newMessages
    })
  }

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prevMessages => {
      const newMessages = prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
      // Call onMessagesUpdate after state update
      setTimeout(() => onMessagesUpdate(newMessages), 0)
      return newMessages
    })
  }

  const removeMessagesAfter = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    const newMessages = messages.slice(0, messageIndex + 1)
    setMessages(newMessages)
    onMessagesUpdate(newMessages)
    
    // Save updated conversation
    if (currentConversationId) {
      const conversation = getConversation(currentConversationId)
      if (conversation) {
        updateConversation(currentConversationId, { messages: newMessages })
      }
    }
  }

  return {
    messages,
    setMessages,
    currentConversationId,
    isNewChatMode,
    saveMessageToStorage,
    updateMessageInStorage,
    createNewConversation,
    addMessage,
    updateMessage,
    removeMessagesAfter
  }
} 