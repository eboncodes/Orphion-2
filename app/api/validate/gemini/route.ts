import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Test the API key by making a simple request to Gemini API
    const ai = new GoogleGenAI({ apiKey })
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
      })
      
      if (response.text) {
        return NextResponse.json({ valid: true })
      } else {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        )
      }
    } catch (error) {
      console.error('Gemini API validation error:', error)
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Gemini API validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    )
  }
} 