"use client"

import { ChatInterface } from '@/components/chat/ChatInterface'
import { mockChatData } from './chatMockData'

export default function ChatInterfacePage() {
  return (
    <ChatInterface
      userName={mockChatData.userName}
      greeting={mockChatData.greeting}
      placeholder={mockChatData.placeholder}
    />
  )
}