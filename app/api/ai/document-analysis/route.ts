import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { getAPIKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const documentFile = formData.get('document') as File
    const userMessage = formData.get('message') as string || 'What is this document about?'

    if (!documentFile) {
      return NextResponse.json(
        { error: 'Document file is required' },
        { status: 400 }
      )
    }

    console.log('📄 Starting document analysis pipeline...')

    // Step 1: Extract text from document
    console.log('📝 Step 1: Extracting text from document...')
    let documentText = ''
    
    try {
      if (documentFile.type === 'text/plain') {
        // Handle plain text files
        documentText = await documentFile.text()
      } else if (documentFile.type === 'application/pdf') {
        // For PDF files, we'll need to use a PDF parsing library
        // For now, we'll return an error suggesting to convert to text
        return NextResponse.json(
          { error: 'PDF processing not yet implemented. Please convert to text file.' },
          { status: 400 }
        )
      } else if (documentFile.type === 'application/msword' || 
                 documentFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle Word documents using mammoth
        const arrayBuffer = await documentFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const result = await mammoth.extractRawText({ buffer })
        documentText = result.value
      } else {
        return NextResponse.json(
          { error: 'Unsupported document type. Please use .txt or .doc/.docx files.' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Document text extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract text from document' },
        { status: 500 }
      )
    }

    console.log('✅ Document text extraction completed')

    // Step 2: Gemini processes the document text and user message
    console.log('🤖 Step 2: Gemini processing data...')

    // Get API key from environment variables
    const geminiApiKey = getAPIKey('gemini')
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }
    
    // Initialize Gemini
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    const processingPrompt = `You are a helpful AI assistant that processes document content. You receive document text and user questions about the document. Your job is to:

1. Understand the document content provided
2. Answer the user's question about the document in a conversational, helpful way
3. Provide insights, summaries, or additional context as needed
4. Keep responses natural and engaging
5. If the user asks for a summary, provide a comprehensive but concise summary
6. If the user asks specific questions, answer them based on the document content

Always be helpful, accurate, and conversational in your responses.

Here's the document content:

${documentText}

User's question: ${userMessage}

Please provide a helpful response to the user's question about this document.`

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: processingPrompt }] }]
    })
    const finalResponse = result.text || 'Unable to process document'
    
    console.log('✅ Gemini processing completed')

    // Step 3: Return the final chat-ready response
    return NextResponse.json({
      response: finalResponse,
      documentText: documentText.substring(0, 500) + '...', // Include first 500 chars for debugging
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in document analysis pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error in document processing pipeline' },
      { status: 500 }
    )
  }
} 