import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const userMessage = formData.get('message') as string || 'What do you see in this image?'

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type

    console.log('🖼️ Starting Gemini image analysis...')

    // Get API key from request headers (sent from client)
    const geminiApiKey = request.headers.get('x-gemini-api-key')
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }
    
    // Initialize Gemini for image analysis
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    // Create a comprehensive prompt that combines image analysis and user question
    const comprehensivePrompt = `You are an expert AI assistant that can analyze images and answer questions about them. 

TASK: Analyze the provided image and answer the user's question about it.

INSTRUCTIONS:
1. First, provide a detailed analysis of the image including:
   - Objects, people, and actions visible
   - Text, colors, and spatial relationships
   - Emotions, context, and notable details
   - Any text or writing visible in the image

2. Then, answer the user's specific question about the image in a conversational, helpful way

3. If the user asks a general question without specific context about the image, provide a helpful response

4. Keep your response natural, engaging, and informative

USER'S QUESTION: ${userMessage}

Please analyze the image and answer the user's question.`

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: comprehensivePrompt },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    })
    const finalResponse = result.text || 'Unable to analyze image with Gemini'

    console.log('✅ Gemini image analysis and processing completed')

    // Step 3: Return the final chat-ready response
    return NextResponse.json({
      response: finalResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in image analysis pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error in image processing pipeline' },
      { status: 500 }
    )
  }
} 