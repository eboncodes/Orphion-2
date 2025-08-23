import { getAPIKeys } from '@/lib/api-keys'

export interface ChatTitleResponse {
  title: string
  timestamp: Date
  confidence?: number
  icon?: string
  iconName?: string
}

export class ChatTitleError extends Error {
  constructor(
    message: string,
    public code: string,
    public timestamp: Date = new Date()
  ) {
    super(message)
    this.name = 'ChatTitleError'
  }
}

export class ChatTitleService {
  private baseUrl: string

  constructor(baseUrl: string = '/api/gemini') {
    this.baseUrl = baseUrl
  }

  private getHeaders(): Record<string, string> {
    const apiKeys = getAPIKeys()
    return {
      'Content-Type': 'application/json',
      'x-gemini-api-key': apiKeys.gemini
    }
  }

  private handleApiError(status: number, message: string): never {
    let userMessage: string
    let errorCode: string

    switch (status) {
      case 429:
        userMessage = "Rate limit exceeded. Please wait a moment before trying again."
        errorCode = "RATE_LIMIT_EXCEEDED"
        break
      case 401:
        userMessage = "Authentication failed. Please check your API configuration."
        errorCode = "AUTHENTICATION_ERROR"
        break
      case 403:
        userMessage = "Access denied. Please check your API permissions."
        errorCode = "PERMISSION_DENIED"
        break
      case 500:
        userMessage = "Server error. Please try again later."
        errorCode = "SERVER_ERROR"
        break
      case 503:
        userMessage = "Service temporarily unavailable. Please try again in a moment."
        errorCode = "SERVICE_UNAVAILABLE"
        break
      default:
        userMessage = `Request failed (${status}): ${message}`
        errorCode = "API_ERROR"
    }

    throw new ChatTitleError(userMessage, errorCode, new Date())
  }

  async generateTitle(userPrompt: string, aiResponse: string): Promise<ChatTitleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/title-generation`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          userPrompt,
          aiResponse
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        title: data.title,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        icon: data.icon,
        iconName: data.iconName
      }
    } catch (error) {
      if (error instanceof ChatTitleError) {
        throw error
      }
      console.error('Chat Title Generation Error:', error)
      throw new ChatTitleError(
        error instanceof Error ? error.message : 'Title generation failed',
        'TITLE_GENERATION_ERROR',
        new Date()
      )
    }
  }

  // Method to generate title with context from multiple messages
  async generateTitleFromMessages(messages: Array<{role: string, content: string}>): Promise<ChatTitleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/title-generation`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          messages
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        title: data.title,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        icon: data.icon,
        iconName: data.iconName
      }
    } catch (error) {
      if (error instanceof ChatTitleError) {
        throw error
      }
      console.error('Chat Title Generation Error:', error)
      throw new ChatTitleError(
        error instanceof Error ? error.message : 'Title generation failed',
        'TITLE_GENERATION_ERROR',
        new Date()
      )
    }
  }

  // Enhanced method to generate title with icon suggestion
  async generateTitleWithIcon(userPrompt: string, aiResponse: string): Promise<ChatTitleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/title-generation`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          userPrompt,
          aiResponse,
          includeIcon: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        title: data.title,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        icon: data.icon,
        iconName: data.iconName
      }
    } catch (error) {
      if (error instanceof ChatTitleError) {
        throw error
      }
      console.error('Chat Title Generation Error:', error)
      throw new ChatTitleError(
        error instanceof Error ? error.message : 'Title generation failed',
        'TITLE_GENERATION_ERROR',
        new Date()
      )
    }
  }
}

// Export a default instance
export const chatTitleService = new ChatTitleService() 