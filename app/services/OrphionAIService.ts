import { getAPIKeys } from '@/lib/api-keys'

export interface OrphionAIResponse {
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

export class OrphionAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public timestamp: Date = new Date()
  ) {
    super(message)
    this.name = 'OrphionAIError'
  }
}

export class OrphionAIService {
  private baseUrl: string
  private imageAnalysisUrl: string
  private documentAnalysisUrl: string
  private pdfAnalysisUrl: string
  private excelAnalysisUrl: string

  constructor(baseUrl: string = '/api/gemini', imageAnalysisUrl: string = '/api/ai/image-analysis', documentAnalysisUrl: string = '/api/ai/document-analysis', pdfAnalysisUrl: string = '/api/ai/pdf-analysis', excelAnalysisUrl: string = '/api/ai/excel-analysis') {
    this.baseUrl = baseUrl
    this.imageAnalysisUrl = imageAnalysisUrl
    this.documentAnalysisUrl = documentAnalysisUrl
    this.pdfAnalysisUrl = pdfAnalysisUrl
    this.excelAnalysisUrl = excelAnalysisUrl

  }

  private getHeaders(): Record<string, string> {
    const apiKeys = getAPIKeys()
    return {
      'Content-Type': 'application/json',
      'x-gemini-api-key': apiKeys.gemini
    }
  }

  private getFileUploadHeaders(): Record<string, string> {
    const apiKeys = getAPIKeys()
    return {
      'x-gemini-api-key': apiKeys.gemini
    }
  }

  private handleApiError(status: number, message: string): never {
    let userMessage: string;
    let errorCode: string;

    switch (status) {
      case 429:
        userMessage = "Rate limit exceeded. Please wait a moment before trying again.";
        errorCode = "RATE_LIMIT_EXCEEDED";
        break;
      case 401:
        userMessage = "Authentication failed. Please check your API configuration.";
        errorCode = "AUTHENTICATION_ERROR";
        break;
      case 403:
        userMessage = "Access denied. Please check your API permissions.";
        errorCode = "PERMISSION_DENIED";
        break;
      case 500:
        userMessage = "Server error. Please try again later.";
        errorCode = "SERVER_ERROR";
        break;
      case 503:
        userMessage = "Service temporarily unavailable. Please try again in a moment.";
        errorCode = "SERVICE_UNAVAILABLE";
        break;
      default:
        userMessage = `Request failed (${status}): ${message}`;
        errorCode = "API_ERROR";
    }

    throw new OrphionAIError(userMessage, errorCode, new Date());
  }

  async sendMessage(message: string): Promise<OrphionAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          conversationHistory: []
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        this.handleApiError(response.status, errorText);
      }

      const data = await response.json()
      return {
        content: data.content,
        timestamp: new Date(data.timestamp),
        metadata: data.metadata
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error;
      }
              console.error('Gemini API Error:', error)
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'SEND_MESSAGE_ERROR',
        new Date()
      )
    }
  }

  async streamMessage(message: string, onChunk: (chunk: string) => void, conversationHistory: Array<{role: string, content: string}> = [], model: string = 'gemini-2.5-flash'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          conversationHistory,
          model
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        this.handleApiError(response.status, errorText);
      }

      // Handle streaming response (SSE format)
      if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = new TextDecoder().decode(value);
            // Process SSE format: data: {"json":"content"}
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  // Extract JSON from the data: prefix
                  const jsonStr = line.substring(5).trim();
                  if (jsonStr === '[DONE]') continue;
                  
                  const data = JSON.parse(jsonStr);
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    onChunk(data.choices[0].delta.content);
                  }
                } catch (e) {
                  console.warn('Error parsing SSE chunk:', e);
                }
              }
            }
          }
        }
      } else {
        // Handle regular JSON response
        const data = await response.json();
        onChunk(data.content);
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error;
      }
              console.error('Gemini Stream Error:', error);
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Stream error occurred',
        'STREAM_MESSAGE_ERROR',
        new Date()
      );
    }
  }



  // Method to handle conversation context
  async sendMessageWithContext(message: string, conversationHistory: Array<{role: string, content: string}>): Promise<OrphionAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          conversationHistory
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        this.handleApiError(response.status, errorText);
      }

      // Handle streaming response (SSE format)
      if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        let fullContent = '';
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = new TextDecoder().decode(value);
            // Process SSE format: data: {"json":"content"}
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  // Extract JSON from the data: prefix
                  const jsonStr = line.substring(5).trim();
                  if (jsonStr === '[DONE]') continue;
                  
                  const data = JSON.parse(jsonStr);
                  if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                    fullContent += data.choices[0].delta.content;
                  }
                } catch (e) {
                  console.warn('Error parsing SSE chunk:', e);
                }
              }
            }
          }
        }

        return {
          content: fullContent,
          timestamp: new Date(),
          metadata: {
            model: 'qwen/qwen3-32b',
            processingTime: 0
          }
        };
      } else {
        // Handle regular JSON response
        const data = await response.json();
        return {
          content: data.content,
          timestamp: new Date(data.timestamp),
          metadata: data.metadata
        };
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error;
      }
              console.error('Gemini Context Service Error:', error);
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Context error occurred',
        'CONTEXT_MESSAGE_ERROR',
        new Date()
      );
    }
  }

  // Method to analyze image and get chat-ready response
  async analyzeImage(imageFile: File, userMessage?: string): Promise<{ response: string; timestamp: Date }> {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      if (userMessage) {
        formData.append('message', userMessage)
      }

      const response = await fetch(this.imageAnalysisUrl, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        response: data.response,
        timestamp: new Date(data.timestamp)
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error
      }
      console.error('Image Analysis Error:', error)
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Image analysis failed',
        'IMAGE_ANALYSIS_ERROR',
        new Date()
      )
    }
  }

  // Method to analyze document and get chat-ready response
  async analyzeDocument(documentFile: File, userMessage?: string): Promise<{ response: string; documentText: string; timestamp: Date }> {
    try {
      const formData = new FormData()
      formData.append('document', documentFile)
      if (userMessage) {
        formData.append('message', userMessage)
      }

      const response = await fetch(this.documentAnalysisUrl, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        response: data.response,
        documentText: data.documentText,
        timestamp: new Date(data.timestamp)
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error
      }
      console.error('Document Analysis Error:', error)
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Document analysis failed',
        'DOCUMENT_ANALYSIS_ERROR',
        new Date()
      )
    }
  }

  // Method to analyze PDF and get chat-ready response
  async analyzePDF(pdfFile: File, userMessage?: string): Promise<{ response: string; pdfText: string; timestamp: Date }> {
    try {
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      if (userMessage) {
        formData.append('message', userMessage)
      }

      const response = await fetch(this.pdfAnalysisUrl, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        response: data.response,
        pdfText: data.pdfText,
        timestamp: new Date(data.timestamp)
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error
      }
      console.error('PDF Analysis Error:', error)
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'PDF analysis failed',
        'PDF_ANALYSIS_ERROR',
        new Date()
      )
    }
  }

  // Method to analyze Excel and get chat-ready response
  async analyzeExcel(excelFile: File, userMessage?: string): Promise<{ response: string; excelData: string; timestamp: Date }> {
    try {
      const formData = new FormData()
      formData.append('excel', excelFile)
      if (userMessage) {
        formData.append('message', userMessage)
      }

      const response = await fetch(this.excelAnalysisUrl, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.handleApiError(response.status, errorText)
      }

      const data = await response.json()
      return {
        response: data.response,
        excelData: data.excelData,
        timestamp: new Date(data.timestamp)
      }
    } catch (error) {
      if (error instanceof OrphionAIError) {
        throw error
      }
      console.error('Excel Analysis Error:', error)
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Excel analysis failed',
        'EXCEL_ANALYSIS_ERROR',
        new Date()
      )
    }
  }

  async searchWeb(query: string): Promise<{
    answer: string
    sources: Array<{
      title: string
      url: string
      content: string
      score: number
      published_date?: string | null
    }>
    query: string
  }> {
    try {
      const response = await fetch('/api/ai/tavily-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        const errorText = await response.text();
        this.handleApiError(response.status, errorText);
      }

      const data = await response.json()
      return {
        answer: data.answer,
        sources: data.sources,
        query: data.query
      }
    } catch (error) {
      console.error('Web search error:', error);
      throw new OrphionAIError(
        error instanceof Error ? error.message : 'Web search failed',
        'SEARCH_ERROR',
        new Date()
      )
    }
  }
}

// Export a default instance
export const orphionAIService = new OrphionAIService()