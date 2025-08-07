import { useState } from 'react'
import { getAPIKey } from '@/lib/api-keys'

interface ImageGenerationResult {
  success: boolean
  image?: string
  prompt?: string
  model?: string
  error?: string
}

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateImage = async (prompt: string): Promise<ImageGenerationResult> => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/ai/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': getAPIKey('gemini')
        },
        body: JSON.stringify({
          prompt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to generate image'
        }
      }

      return {
        success: true,
        image: data.image,
        prompt: data.prompt,
        model: data.model
      }
    } catch (error) {
      console.error('Image generation error:', error)
      return {
        success: false,
        error: 'Failed to generate image'
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateImage,
    isGenerating
  }
} 