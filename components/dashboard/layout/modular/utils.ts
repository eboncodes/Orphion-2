export const getPlaceholderText = (selectedTool: string | null) => {
  switch (selectedTool) {
    case 'study':
      return "Enter a topic to study or learn about..."
    case 'image':
      return "Describe the image you want to generate..."
    case 'pages':
      return "Describe the page/document you want to create..."
    case 'table':
      return "Describe the table you want generated (columns, rows, topic)..."
    case 'webpage':
      return "Describe the app or webpage you want generated in HTML/CSS/JS..."
    default:
      return "Give Orphion a task to work on"
  }
}

export const handlePageNavigation = (pageId: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = `/pages?page=${pageId}`
  }
}

export const createErrorContent = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('Server error')) {
      return "I'm experiencing technical difficulties right now. Please try again in a few moments."
    } else if (error.message.includes('Authentication failed')) {
      return "I'm having trouble connecting to the AI service. Please check the API configuration."
    } else if (error.message.includes('Rate limit exceeded')) {
      return "I'm receiving too many requests right now. Please wait a moment before trying again."
    } else {
      return "I'm having trouble processing your request. Please try again or contact support if the issue persists."
    }
  }
  return "I'm experiencing technical difficulties. Please try again later."
}

export const createFallbackContent = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes('Server error')) {
      return "I'm experiencing technical difficulties right now. Please try again in a few moments, or check if the AI service is running properly."
    } else if (error.message.includes('Authentication failed')) {
      return "I'm having trouble connecting to the AI service. Please check the API configuration and try again."
    } else if (error.message.includes('Rate limit exceeded')) {
      return "I'm receiving too many requests right now. Please wait a moment before trying again."
    } else {
      return "I'm having trouble processing your request. Please try again or contact support if the issue persists."
    }
  }
  return "I'm experiencing technical difficulties. Please try again later."
}
