import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getAPIKeys } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const geminiApiKey = request.headers.get('x-gemini-api-key')
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenAI({
      apiKey: geminiApiKey,
    })
    
    const model = 'gemini-2.5-flash-lite'

    // Create a conversation summary for title generation
    const conversationText = messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n')

    const prompt = `Based on the following conversation, generate a concise and descriptive title (maximum 50 characters) that captures the main topic or theme of the discussion. The title should be:

1. Clear and descriptive
2. Maximum 50 characters
3. No quotes or special formatting
4. Focus on the main topic or question being discussed
5. Use title case (capitalize first letter of each word)

Conversation:
${conversationText}

Generate only the title, nothing else:`

    const result = await genAI.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }]
    })
    const title = result.text?.trim() || 'Chat'

    return NextResponse.json({ title })
  } catch (error) {
    console.error('Error generating chat title:', error)
    return NextResponse.json(
      { error: `Failed to generate chat title: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 