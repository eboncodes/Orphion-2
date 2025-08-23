"use client"

import React, { useState, useCallback, useEffect } from "react"
import { 
  ChatMessage, 
  ChatConversation, 
  createConversation, 
  getConversation, 
  getConversations,
  updateConversation, 
  addMessageToConversation, 
  updateMessageInConversation,
  getMostRecentConversation,
  hasSavedConversations,
  cleanupStorage,
  deleteConversation,
  clearAllConversations
} from '@/lib/chat-storage'

interface ConversationManagerProps {
  currentConversationId?: string | null
  onConversationLoad: (conversation: ChatConversation) => void
  onConversationCreate: (conversation: ChatConversation) => void
  onConversationUpdate: (conversationId: string, updates: Partial<ChatConversation>) => void
  onConversationDelete: (conversationId: string) => void
}

export default function ConversationManager({
  currentConversationId,
  onConversationLoad,
  onConversationCreate,
  onConversationUpdate,
  onConversationDelete
}: ConversationManagerProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load all conversations
  const loadConversations = useCallback(() => {
    try {
      const savedConversations = getConversations()
      setConversations(savedConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [])

  // Load specific conversation
  const loadConversation = useCallback((conversationId: string) => {
    try {
      const conversation = getConversation(conversationId)
      if (conversation) {
        setCurrentConversation(conversation)
        onConversationLoad(conversation)
        return conversation
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
    return null
  }, [onConversationLoad])

  // Create new conversation
  const createNewConversation = useCallback((title?: string, modelUsed?: string) => {
    try {
      const newConversation = createConversation(title, modelUsed)
      setCurrentConversation(newConversation)
      onConversationCreate(newConversation)
      
      // Reload conversations list
      loadConversations()
      
      return newConversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }, [onConversationCreate, loadConversations])

  // Update conversation
  const updateCurrentConversation = useCallback((updates: Partial<ChatConversation>) => {
    if (!currentConversation) return

    try {
      updateConversation(currentConversation.id, updates)
      setCurrentConversation(prev => prev ? { ...prev, ...updates } : null)
      onConversationUpdate(currentConversation.id, updates)
      
      // Reload conversations list
      loadConversations()
    } catch (error) {
      console.error('Error updating conversation:', error)
    }
  }, [currentConversation, onConversationUpdate, loadConversations])

  // Add message to current conversation
  const addMessageToCurrentConversation = useCallback(async (message: ChatMessage) => {
    if (!currentConversation) return

    try {
      await addMessageToConversation(currentConversation.id, message)
      
      // Update current conversation state
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        updatedAt: new Date()
      } : null)
      
      // Reload conversations list
      loadConversations()
      
      // Clean up storage if needed
      cleanupStorage()
    } catch (error) {
      console.error('Error adding message to conversation:', error)
    }
  }, [currentConversation, loadConversations])

  // Update message in current conversation
  const updateMessageInCurrentConversation = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    if (!currentConversation) return

    try {
      updateMessageInConversation(currentConversation.id, messageId, updates)
      
      // Update current conversation state
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
        updatedAt: new Date()
      } : null)
      
      // Reload conversations list
      loadConversations()
    } catch (error) {
      console.error('Error updating message in conversation:', error)
    }
  }, [currentConversation, loadConversations])

  // Delete conversation
  const deleteCurrentConversation = useCallback(() => {
    if (!currentConversation) return

    try {
      deleteConversation(currentConversation.id)
      setCurrentConversation(null)
      onConversationDelete(currentConversation.id)
      
      // Reload conversations list
      loadConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }, [currentConversation, onConversationDelete, loadConversations])

  // Clear all conversations
  const clearAllConversationsData = useCallback(() => {
    try {
      clearAllConversations()
      setConversations([])
      setCurrentConversation(null)
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }, [])



  // Load conversation when currentConversationId changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId)
    } else if (currentConversationId === null) {
      setCurrentConversation(null)
    } else if (currentConversationId === undefined && hasSavedConversations() && !currentConversation) {
      // Load most recent conversation on initial mount
      const mostRecent = getMostRecentConversation()
      if (mostRecent) {
        loadConversation(mostRecent.id)
      }
    }
  }, [currentConversationId, loadConversation, currentConversation])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    currentConversation,
    isLoading,
    loadConversations,
    loadConversation,
    createNewConversation,
    updateCurrentConversation,
    addMessageToCurrentConversation,
    updateMessageInCurrentConversation,
    deleteCurrentConversation,
    clearAllConversationsData,

  }
} 