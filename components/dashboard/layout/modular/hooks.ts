import { useState, useEffect, useRef } from "react"
import { getConversation } from "@/lib/chat-storage"

export const useDashboardState = (messages: any[], onMessagesUpdate: (messages: any[]) => void) => {
  const [localMessages, setLocalMessages] = useState<any[]>(messages)
  const latestAIMessage = useRef<any>(null)
  const isPropUpdate = useRef(false)

  // Update parent when local messages change
  useEffect(() => {
    if (isPropUpdate.current) {
      isPropUpdate.current = false
      return
    }
    onMessagesUpdate(localMessages)
  }, [localMessages, onMessagesUpdate])

  // Update local messages when prop messages change
  useEffect(() => {
    isPropUpdate.current = true
    setLocalMessages(messages)
  }, [messages])

  const handleLocalMessagesUpdate = (newMessages: any[]) => {
    setLocalMessages(newMessages)
    onMessagesUpdate(newMessages)
  }

  return {
    localMessages,
    setLocalMessages,
    latestAIMessage,
    handleLocalMessagesUpdate
  }
}

export const useConversationLoader = (currentConversationId: string | null) => {
  const [localMessages, setLocalMessages] = useState<any[]>([])

  useEffect(() => {
    if (currentConversationId) {
      const conversation = getConversation(currentConversationId)
      if (conversation) {
        console.log('Loading conversation from storage:', conversation.id)
        setLocalMessages(conversation.messages)
      }
    }
  }, [currentConversationId])

  return { localMessages, setLocalMessages }
}
