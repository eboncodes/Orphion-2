import { useState, useCallback } from 'react'
import { canvasTitleService, CanvasTitleResponse } from '@/app/services/CanvasTitleService'

interface UseCanvasTitleProps {
  onTitleGenerated?: (title: string) => void
  onError?: (error: string) => void
}

export function useCanvasTitle({ onTitleGenerated, onError }: UseCanvasTitleProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedTitle, setLastGeneratedTitle] = useState<CanvasTitleResponse | null>(null)

  const generateTitle = useCallback(async (
    userPrompt: string, 
    aiResponse: string, 
    geminiApiKey: string,
    includeIcon: boolean = false
  ) => {
    setIsGenerating(true)
    try {
      const result = await canvasTitleService.generateTitle(userPrompt, aiResponse, geminiApiKey, includeIcon)
      setLastGeneratedTitle(result)
      onTitleGenerated?.(result.title)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Title generation failed'
      onError?.(errorMessage)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [onTitleGenerated, onError])

  const generateTitleFromMessages = useCallback(async (
    messages: Array<{role: string, content: string}>, 
    geminiApiKey: string,
    includeIcon: boolean = false
  ) => {
    setIsGenerating(true)
    try {
      const result = await canvasTitleService.generateTitleFromMessages(messages, geminiApiKey, includeIcon)
      setLastGeneratedTitle(result)
      onTitleGenerated?.(result.title)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Title generation failed'
      onError?.(errorMessage)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [onTitleGenerated, onError])

  const generateTitleWithIcon = useCallback(async (
    userPrompt: string, 
    aiResponse: string, 
    geminiApiKey: string
  ) => {
    setIsGenerating(true)
    try {
      const result = await canvasTitleService.generateTitleWithIcon(userPrompt, aiResponse, geminiApiKey)
      setLastGeneratedTitle(result)
      onTitleGenerated?.(result.title)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Title generation failed'
      onError?.(errorMessage)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [onTitleGenerated, onError])

  return {
    generateTitle,
    generateTitleFromMessages,
    generateTitleWithIcon,
    isGenerating,
    lastGeneratedTitle
  }
}
