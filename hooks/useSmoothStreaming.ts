import { useState, useCallback, useRef } from 'react'

interface UseSmoothStreamingProps {
  messageId: string
  onUpdate: (messageId: string, content: string) => void
}

export const useSmoothStreaming = ({ messageId, onUpdate }: UseSmoothStreamingProps) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const contentRef = useRef('')
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTime = useRef(0)

  const updateContent = useCallback((newChunk: string) => {
    contentRef.current += newChunk
    
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTime.current
    
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    // Throttle updates to 60fps for smooth animation
    if (timeSinceLastUpdate >= 16) { // ~60fps
      onUpdate(messageId, contentRef.current)
      lastUpdateTime.current = now
    } else {
      // Schedule update for next frame
      updateTimeoutRef.current = setTimeout(() => {
        onUpdate(messageId, contentRef.current)
        lastUpdateTime.current = Date.now()
      }, 16 - timeSinceLastUpdate)
    }
  }, [messageId, onUpdate])

  const startStreaming = useCallback(() => {
    setIsStreaming(true)
    contentRef.current = ''
    lastUpdateTime.current = 0
  }, [])

  const stopStreaming = useCallback(() => {
    setIsStreaming(false)
    // Ensure final content is updated
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    onUpdate(messageId, contentRef.current)
  }, [messageId, onUpdate])

  return {
    isStreaming,
    updateContent,
    startStreaming,
    stopStreaming
  }
} 