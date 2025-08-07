import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  let prompt: string = ''
  
  try {
    const body = await request.json()
    prompt = body.prompt

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get API key from request headers (sent from client)
    const geminiApiKey = request.headers.get('x-gemini-api-key')
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }
    
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    })

    const response = await ai.models.generateImages({
      model: 'models/imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    })

    if (!response?.generatedImages || response.generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    const imageData = response.generatedImages[0].image.imageBytes

    console.log('Image generation successful')
    console.log('Image data size:', imageData.length)

    return NextResponse.json({
      success: true,
      image: imageData, // Return the base64 data
      prompt,
      model: "models/imagen-3.0-generate-002"
    })

  } catch (error) {
    console.error('Image generation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      prompt
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    )
  }
} 