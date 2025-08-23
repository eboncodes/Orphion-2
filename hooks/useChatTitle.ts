import { useCallback, useState } from 'react'
import { chatTitleService, ChatTitleResponse, ChatTitleError } from '@/app/services/ChatTitleService'

interface UseChatTitleProps {
  onTitleGenerated?: (title: string) => void
  onError?: (error: string) => void
}

export function useChatTitle({ onTitleGenerated, onError }: UseChatTitleProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState<ChatTitleResponse | null>(null)

  const generateTitle = useCallback(async (
    userPrompt: string,
    aiResponse: string
  ): Promise<ChatTitleResponse> => {
    setIsGenerating(true)
    
    try {
      const result = await chatTitleService.generateTitle(userPrompt, aiResponse)
      setLastGeneratedTitle(result)
      onTitleGenerated?.(result.title)
      return result
    } catch (error) {
      const errorMessage = error instanceof ChatTitleError 
        ? error.message 
        : 'Title generation failed'
      
      console.error('Title generation error:', error)
      onError?.(errorMessage)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [onTitleGenerated, onError])

  const generateTitleFromMessages = useCallback(async (
    messages: Array<{role: string, content: string}>
  ): Promise<ChatTitleResponse> => {
    setIsGenerating(true)
    
    try {
      const result = await chatTitleService.generateTitleFromMessages(messages)
      setLastGeneratedTitle(result)
      onTitleGenerated?.(result.title)
      return result
    } catch (error) {
      const errorMessage = error instanceof ChatTitleError 
        ? error.message 
        : 'Title generation failed'
      
      console.error('Title generation error:', error)
      onError?.(errorMessage)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [onTitleGenerated, onError])

  return {
    generateTitle,
    generateTitleFromMessages,
    isGenerating,
    lastGeneratedTitle
  }
} 