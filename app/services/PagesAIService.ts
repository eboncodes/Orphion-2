import { getAPIKeys } from '@/lib/api-keys'

export interface PagesAIResponse {
  content: string
  pageContent?: string | null
  timestamp: Date
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

export class PagesAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public timestamp: Date = new Date()
  ) {
    super(message)
    this.name = 'PagesAIError'
  }
}

export class PagesAIService {
  private baseUrl: string

  constructor(baseUrl: string = '/api/gemini/pages-chat') {
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

    throw new PagesAIError(userMessage, errorCode, new Date());
  }

  // Method to stream message with context for Pages
  async streamMessage(
    message: string, 
    conversationHistory: Array<{role: string, content: string}>, 
    onChunk: (chunk: string) => void, 
    onPageContent?: (pageContent: string) => void,
    onComplete?: (fullContent: string) => void
  ): Promise<PagesAIResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          conversationHistory,
          stream: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        this.handleApiError(response.status, errorText);
      }

      if (!response.body) {
        throw new PagesAIError('No response body', 'STREAM_ERROR', new Date());
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let pageContent: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'chunk') {
                  console.log('PagesAIService received chunk:', {
                    content: data.content,
                    contentType: typeof data.content,
                    fullData: data
                  });

                  // Ensure content is always a string
                  let chunkContent = data.content;
                  if (typeof chunkContent !== 'string') {
                    console.error('Chunk content is not a string:', chunkContent);
                    chunkContent = String(chunkContent);
                  }

                  onChunk(chunkContent);
                  fullContent += chunkContent;
                } else if (data.type === 'complete') {
                  pageContent = data.pageContent || null;
                  if (pageContent && onPageContent) {
                    onPageContent(pageContent);
                  }
                  if (onComplete) {
                    onComplete(fullContent);
                  }
                  return {
                    content: fullContent,
                    pageContent,
                    timestamp: new Date(data.timestamp),
                    metadata: data.metadata
                  };
                } else if (data.type === 'error') {
                  throw new PagesAIError(data.error || 'Streaming error', 'STREAM_ERROR', new Date());
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // This part will now only be reached if the stream ends without a 'complete' message
      if (onComplete) {
        onComplete(fullContent);
      }
      
      return {
        content: fullContent,
        pageContent,
        timestamp: new Date(),
        metadata: {
          model: 'gemini-2.5-flash',
          processingTime: 0
        }
      };
    } catch (error) {
      if (error instanceof PagesAIError) {
        throw error;
      }
      console.error('Pages Streaming Error:', error);
      throw new PagesAIError(
        error instanceof Error ? error.message : 'Streaming failed',
        'STREAM_ERROR',
        new Date()
      );
    }
  }

  // Method to send message with context for Pages
  async sendMessageWithContext(message: string, conversationHistory: Array<{role: string, content: string}>): Promise<PagesAIResponse> {
    try {
      const response = await fetch(this.baseUrl, {
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

      const data = await response.json();
      return {
        content: data.content,
        timestamp: new Date(),
        metadata: data.metadata
      };
    } catch (error) {
      if (error instanceof PagesAIError) {
        throw error;
      }
      console.error('Pages Context Service Error:', error);
      throw new PagesAIError(
        error instanceof Error ? error.message : 'Context error occurred',
        'CONTEXT_MESSAGE_ERROR',
        new Date()
      );
    }
  }
}

// Export a default instance
export const pagesAIService = new PagesAIService()
