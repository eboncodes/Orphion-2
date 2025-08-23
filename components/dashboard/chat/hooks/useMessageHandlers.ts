import { useCallback } from 'react'
import { ChatMessage } from '@/lib/chat-storage'

type Message = ChatMessage

interface UseMessageHandlersProps {
  messages: Message[]
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  updateMessageInStorage: (messageId: string, updates: Partial<Message>) => void
  onMessagesUpdate: (messages: Message[]) => void
  sendMessageInternal: () => Promise<void>
  removeMessagesAfter: (messageId: string) => void
}

export function useMessageHandlers({
  messages,
  updateMessage,
  updateMessageInStorage,
  onMessagesUpdate,
  sendMessageInternal,
  removeMessagesAfter
}: UseMessageHandlersProps) {
  const handleLikeMessage = useCallback((messageId: string) => {
    updateMessage(messageId, { isLiked: true, isDisliked: false })
    
    // Update in localStorage
    updateMessageInStorage(messageId, { isLiked: true, isDisliked: false })
    
    // Notify parent
    onMessagesUpdate(messages)
  }, [updateMessage, updateMessageInStorage, onMessagesUpdate, messages])

  const handleDislikeMessage = useCallback((messageId: string) => {
    updateMessage(messageId, { isLiked: false, isDisliked: true })
    
    // Update in localStorage
    updateMessageInStorage(messageId, { isLiked: false, isDisliked: true })
    
    // Notify parent
    onMessagesUpdate(messages)
  }, [updateMessage, updateMessageInStorage, onMessagesUpdate, messages])

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    const messageToRegenerate = messages.find(msg => msg.id === messageId)
    if (!messageToRegenerate || messageToRegenerate.sender !== 'user') return

    // Remove the AI response that follows this user message
    removeMessagesAfter(messageId)
    
    // Send the message again
    await sendMessageInternal()
  }, [messages, sendMessageInternal, removeMessagesAfter])

  return {
    handleLikeMessage,
    handleDislikeMessage,
    handleRegenerateMessage
  }
} 