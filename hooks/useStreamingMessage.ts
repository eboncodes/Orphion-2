import { useCallback, useRef } from 'react'
import { orphionAIService } from '@/app/services/OrphionAIService'

interface UseStreamingMessageProps {
  onChunk: (chunk: string, fullContent: string) => void
  onComplete: (fullContent: string) => void
  onError: (error: string) => void
}

export function useStreamingMessage({
  onChunk,
  onComplete,
  onError
}: UseStreamingMessageProps) {
  const abortControllerRef = useRef<AbortController | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)

  const streamMessage = useCallback(async (
    message: string,
    conversationHistory: Array<{role: string, content: string}>
  ) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    let fullContent = ''
    lastUpdateTimeRef.current = 0

    try {
      await orphionAIService.streamMessage(
        message,
        conversationHistory,
        (chunk: string) => {
          fullContent += chunk
          
          const now = Date.now()
          const timeSinceLastUpdate = now - lastUpdateTimeRef.current
          
          // Clear any pending update
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }
          
          // Throttle updates to 60fps for smooth animation
          if (timeSinceLastUpdate >= 16) { // ~60fps
            onChunk(chunk, fullContent)
            lastUpdateTimeRef.current = now
          } else {
            // Schedule update if not throttled
            updateTimeoutRef.current = setTimeout(() => {
              onChunk(chunk, fullContent)
              lastUpdateTimeRef.current = Date.now()
            }, 16 - timeSinceLastUpdate)
          }
        }
      )

      // Ensure final content is processed
      onComplete(fullContent)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, don't show error
        return
      }
      
      console.error('Streaming error:', error)
      onError(error instanceof Error ? error.message : 'Streaming failed')
    } finally {
      // Clean up
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }
      abortControllerRef.current = null
    }
  }, [onChunk, onComplete, onError])

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }
  }, [])

  return {
    streamMessage,
    cancelStream,
    isStreaming: abortControllerRef.current !== null
  }
} 