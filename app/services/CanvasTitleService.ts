export interface CanvasTitleResponse {
  title: string
  timestamp: Date
  confidence: number
  icon: string
  iconName: string
  metadata: {
    model: string
    processingTime: number
  }
}

export interface CanvasTitleError {
  message: string
  code: string
}

class CanvasTitleService {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/gemini/canvas-title-generation'
  }

  // Method to generate title with user prompt and AI response
  async generateTitle(userPrompt: string, aiResponse: string, geminiApiKey: string, includeIcon: boolean = false): Promise<CanvasTitleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          userPrompt,
          aiResponse,
          includeIcon,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Title generation failed')
      }

      const data = await response.json()
      return {
        title: data.title,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        icon: data.icon,
        iconName: data.iconName,
        metadata: data.metadata,
      }
    } catch (error) {
      console.error('Canvas Title Generation Error:', error)
      throw {
        message: error instanceof Error ? error.message : 'Title generation failed',
        code: 'CANVAS_TITLE_GENERATION_ERROR',
      } as CanvasTitleError
    }
  }

  // Method to generate title with context from multiple messages
  async generateTitleFromMessages(messages: Array<{role: string, content: string}>, geminiApiKey: string, includeIcon: boolean = false): Promise<CanvasTitleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          messages,
          includeIcon,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Title generation failed')
      }

      const data = await response.json()
      return {
        title: data.title,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        icon: data.icon,
        iconName: data.iconName,
        metadata: data.metadata,
      }
    } catch (error) {
      console.error('Canvas Title Generation Error:', error)
      throw {
        message: error instanceof Error ? error.message : 'Title generation failed',
        code: 'CANVAS_TITLE_GENERATION_ERROR',
      } as CanvasTitleError
    }
  }

  // Enhanced method to generate title with icon suggestion
  async generateTitleWithIcon(userPrompt: string, aiResponse: string, geminiApiKey: string): Promise<CanvasTitleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          userPrompt,
          aiResponse,
          includeIcon: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Title generation failed')
      }

      const data = await response.json()
      return {
        title: data.title,
        timestamp: new Date(data.timestamp),
        confidence: data.confidence,
        icon: data.icon,
        iconName: data.iconName,
        metadata: data.metadata,
      }
    } catch (error) {
      console.error('Canvas Title Generation Error:', error)
      throw {
        message: error instanceof Error ? error.message : 'Title generation failed',
        code: 'CANVAS_TITLE_GENERATION_ERROR',
      } as CanvasTitleError
    }
  }
}

export const canvasTitleService = new CanvasTitleService()
