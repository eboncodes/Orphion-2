"use client"

import { useState, useRef, useEffect } from 'react'


interface ChatGPTStyleScrollingProps {
  messages: any[]
  isLoading: boolean
  children: React.ReactNode
  showScrollButton?: boolean
  disableScrollButton?: boolean
}

export default function ChatGPTStyleScrolling({
  messages,
  isLoading,
  children,
  showScrollButton = true,
  disableScrollButton = false
}: ChatGPTStyleScrollingProps) {
  const scrollableRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [showScrollDownButton, setShowScrollDownButton] = useState(false)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)

  // Check if user is at bottom
  const isAtBottom = () => {
    if (!scrollableRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current
    return scrollHeight - scrollTop <= clientHeight + 50
  }

  // Handle scroll events to show/hide scroll down button
  const handleScroll = () => {
    if (scrollableRef.current && !isAutoScrolling) {
      const atBottom = isAtBottom()
      setShowScrollDownButton(!atBottom)
    }
  }

  // Auto-scroll to bottom ONLY when user sends a new message
  useEffect(() => {
    const currentMessageCount = messages.length
    
    // Only scroll if this is a new message (user sent something)
    if (currentMessageCount > lastMessageCount) {
      setIsAutoScrolling(true)
      setShowScrollDownButton(false)
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        
        // Wait for scroll to complete before allowing button to show again
        setTimeout(() => {
          setIsAutoScrolling(false)
        }, 500)
      }, 100)
    }
    
    setLastMessageCount(currentMessageCount)
  }, [messages.length, lastMessageCount])

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollDownButton(false)
  }

  return (
    <div 
      ref={scrollableRef}
      className="flex-1 min-h-0 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
      style={{ backgroundColor: '#f5f7f6' }}
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {children}
          

          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Scroll down button - appears when user has scrolled up */}
      {showScrollButton && !disableScrollButton && showScrollDownButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-6 right-6 z-50 p-2 bg-white text-gray-600 rounded-full border border-gray-300 shadow-sm hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
          title="Scroll to bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  )
} 