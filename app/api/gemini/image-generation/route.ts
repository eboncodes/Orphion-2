import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getAPIKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body || {}

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    const apiKey = getAPIKey('gemini')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    const config = {
      responseModalities: ['IMAGE', 'TEXT'] as ('IMAGE' | 'TEXT')[],
    }

    const model = 'gemini-2.0-flash-preview-image-generation'

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ] as any

    const response = await ai.models.generateContentStream({
      model,
      config: config as any,
      contents,
    })

    const images: Array<{ data: string; mimeType?: string }> = []
    let text = ''

    for await (const chunk of response as any) {
      const parts = chunk?.candidates?.[0]?.content?.parts
      if (!parts || !Array.isArray(parts)) continue
      for (const part of parts) {
        if (part?.inlineData?.data) {
          images.push({ data: part.inlineData.data, mimeType: part.inlineData.mimeType })
        } else if (part?.text) {
          text += String(part.text)
        }
      }
    }

    return NextResponse.json({
      images,
      text,
      model,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error?.message || 'Image generation failed' },
      { status: 500 }
    )
  }
}


