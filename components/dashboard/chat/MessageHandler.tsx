"use client"

import React, { useState, useCallback, useEffect } from "react"
import { orphionAIService } from "@/app/services/OrphionAIService"
import { 
  ChatMessage, 
  ChatConversation, 
  createConversation, 
  getConversation, 
  updateConversation, 
  addMessageToConversation, 
  updateMessageInConversation,
  getMostRecentConversation,
  hasSavedConversations,
  cleanupStorage
} from '@/lib/chat-storage'

interface MessageHandlerProps {
  currentConversationId?: string | null
  onMessagesUpdate: (messages: ChatMessage[]) => void
  onMessageUpdate: (messageId: string, newContent: string) => void
  onTitleGenerated?: (title: string) => void
}

export default function MessageHandler({
  currentConversationId: propCurrentConversationId,
  onMessagesUpdate,
  onMessageUpdate,
  onTitleGenerated
}: MessageHandlerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isNewChatMode, setIsNewChatMode] = useState(false)

  // Helper function to save messages to localStorage
  const saveMessageToStorage = async (message: ChatMessage) => {
    if (currentConversationId) {
      await addMessageToConversation(currentConversationId, message)
      // Clean up storage if needed
      cleanupStorage()
    }
  }

  // Helper function to update messages in localStorage
  const updateMessageInStorage = (messageId: string, updates: Partial<ChatMessage>) => {
    if (currentConversationId) {
      updateMessageInConversation(currentConversationId, messageId, updates)
    }
  }

  // Load conversation from props or most recent conversation on mount
  const loadConversation = useCallback((conversationId: string | null) => {
    console.log('MessageHandler: conversationId changed to:', conversationId)
    
    if (conversationId) {
      // Load conversation from props (when user clicks on sidebar)
      const conversation = getConversation(conversationId)
      if (conversation) {
        console.log('MessageHandler: Loading conversation:', conversation.id)
        setMessages(conversation.messages)
        setCurrentConversationId(conversation.id)
        setIsNewChatMode(false)
        if (conversation.messages.length > 0) {
          // Conversation loaded successfully
        }
      }
    } else if (propCurrentConversationId === null) {
      // Explicitly clear conversation state when propCurrentConversationId is null
      console.log('MessageHandler: Clearing conversation state for new chat')
      setMessages([])
      setCurrentConversationId(null)
      setIsNewChatMode(true)
    } else if (propCurrentConversationId === undefined && hasSavedConversations() && messages.length === 0 && !isNewChatMode) {
      // Only load most recent conversation on initial mount, not when explicitly setting to null
      const mostRecent = getMostRecentConversation()
      if (mostRecent) {
        console.log('MessageHandler: Loading most recent conversation:', mostRecent.id)
        setMessages(mostRecent.messages)
        setCurrentConversationId(mostRecent.id)
        if (mostRecent.messages.length > 0) {
          // Conversation loaded successfully
        }
      }
    }
  }, [messages.length, isNewChatMode])

  // Load conversation when propCurrentConversationId changes
  useEffect(() => {
    if (propCurrentConversationId) {
      loadConversation(propCurrentConversationId)
    } else if (propCurrentConversationId === null) {
      loadConversation(null)
    } else if (propCurrentConversationId === undefined && hasSavedConversations() && messages.length === 0 && !isNewChatMode) {
      // Load most recent conversation on initial mount
      const mostRecent = getMostRecentConversation()
      if (mostRecent) {
        loadConversation(mostRecent.id)
      }
    }
  }, [propCurrentConversationId, loadConversation, messages.length, isNewChatMode])

  // Handle like message
  const handleLikeMessage = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLiked: true, isDisliked: false }
          : msg
      )
    )
    
    // Update in localStorage
    updateMessageInStorage(messageId, { isLiked: true, isDisliked: false })
    
    // Notify parent
    onMessagesUpdate(messages)
  }

  // Handle dislike message
  const handleDislikeMessage = (messageId: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, isLiked: false, isDisliked: true }
          : msg
      )
    )
    
    // Update in localStorage
    updateMessageInStorage(messageId, { isLiked: false, isDisliked: true })
    
    // Notify parent
    onMessagesUpdate(messages)
  }

  // Handle regenerate message
  const handleRegenerateMessage = async (messageId: string) => {
    const messageToRegenerate = messages.find(msg => msg.id === messageId)
    if (!messageToRegenerate || messageToRegenerate.sender !== 'user') return

    // Remove the AI response that follows this user message
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
    
    // Send the message again
    await sendMessageInternal(messageToRegenerate.content)
  }

  // Send message internally
  const sendMessageInternal = async (messageContent: string) => {
    if (!messageContent.trim()) return

    setIsLoading(true)

    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: messageContent,
        sender: 'user',
        timestamp: new Date()
      }

      // Add user message to state
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      onMessagesUpdate(updatedMessages)

      // Create or get conversation
      let conversationId = currentConversationId
      if (!conversationId) {
        const newConversation = createConversation()
        conversationId = newConversation.id
        setCurrentConversationId(conversationId)
        setIsNewChatMode(false)
        // Conversation started successfully
      }

      // Save user message to storage
      await saveMessageToStorage(userMessage)

      // Prepare conversation history for AI
      const conversationHistory = updatedMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // Create AI message placeholder
      const aiMessageId = `ai-${Date.now()}`
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date()
      }

      // Add AI message placeholder
      const messagesWithAI = [...updatedMessages, aiMessage]
      setMessages(messagesWithAI)
      onMessagesUpdate(messagesWithAI)

      // Stream response from AI
      let fullContent = ''
      let lastUpdateTime = 0
      let updateTimeout: NodeJS.Timeout | null = null

      try {
        // Note: For chat components, file analysis would need to be passed from parent
        // For now, we'll use the message content as-is
        // TODO: Integrate file analysis when attachedFile is available in this context
        await orphionAIService.streamMessage(messageContent, conversationHistory, (chunk: string) => {
          fullContent += chunk
          
          const now = Date.now()
          const timeSinceLastUpdate = now - lastUpdateTime
          
          // Clear any pending update
          if (updateTimeout) {
            clearTimeout(updateTimeout)
          }
          
          // Throttle updates to 60fps for smooth animation
          if (timeSinceLastUpdate >= 16) { // ~60fps
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            ))
            onMessagesUpdate(messagesWithAI.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            ))
            lastUpdateTime = now
          } else {
            // Schedule update if not throttled
            updateTimeout = setTimeout(() => {
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: fullContent }
                  : msg
              ))
              onMessagesUpdate(messagesWithAI.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: fullContent }
                  : msg
              ))
              lastUpdateTime = Date.now()
            }, 16 - timeSinceLastUpdate)
          }
        })

        // Ensure final content is set
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullContent }
            : msg
        ))
        onMessagesUpdate(messagesWithAI.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullContent }
            : msg
        ))

        // Generate title for new conversations
        if (messages.length === 0 && onTitleGenerated) {
          try {
            const { chatTitleService } = await import('@/app/services/ChatTitleService')
            const titleResult = await chatTitleService.generateTitle(messageContent, fullContent)
            onTitleGenerated(titleResult.title)
          } catch (titleError) {
            console.error('Title generation failed:', titleError)
            // Don't fail the entire conversation if title generation fails
          }
        }

      // Save final AI message
        const finalAIMessage = { ...aiMessage, content: fullContent }
      await saveMessageToStorage(finalAIMessage)
      } catch (streamError) {
        console.error('Streaming error:', streamError)
        
        // Update message with error
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: 'Sorry, I encountered an error while streaming. Please try again.' }
            : msg
        ))
        onMessagesUpdate(messagesWithAI.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: 'Sorry, I encountered an error while streaming. Please try again.' }
            : msg
        ))
        
        // Save error message
        const errorAIMessage = { ...aiMessage, content: 'Sorry, I encountered an error while streaming. Please try again.' }
        await saveMessageToStorage(errorAIMessage)
      }



    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      onMessagesUpdate(messages)
    } finally {
      setIsLoading(false)
    }
  }





  // Remove canvas-related functionality
  // const handleCanvasMessageUpdate = (messageId: string, newContent: string) => {
  //   // Canvas functionality removed
  // }

  return {
    messages,
    isLoading,
    currentConversationId,
    isNewChatMode,
    loadConversation,
    handleLikeMessage,
    handleDislikeMessage,
    handleRegenerateMessage,
    sendMessageInternal,
    // handleCanvasMessageUpdate
  }
} 