import { NextRequest, NextResponse } from 'next/server'
import PDFParser from 'pdf2json'
import { getAPIKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const userMessage = formData.get('message') as string || 'What is this PDF about?'

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      )
    }

    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    console.log('📄 Starting PDF analysis pipeline...')

    // Step 1: Extract text from PDF
    console.log('📝 Step 1: Extracting text from PDF...')
    let pdfText = ''
    
    try {
      // Convert PDF file to buffer
      const arrayBuffer = await pdfFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Parse PDF using pdf2json
      const pdfParser = new PDFParser()
      
      // Create a promise to handle the PDF parsing
      const parsePromise = new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            // Extract text from all pages
            const pages = pdfData.Pages || []
            const textArray: string[] = []
            
            pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((text: any) => {
                  if (text.R && text.R.length > 0) {
                    text.R.forEach((r: any) => {
                      if (r.T) {
                        // Decode the text (pdf2json encodes text)
                        const decodedText = decodeURIComponent(r.T)
                        textArray.push(decodedText)
                      }
                    })
                  }
                })
              }
            })
            
            pdfText = textArray.join(' ')
            resolve(pdfText)
          } catch (error) {
            reject(error)
          }
        })
        
        pdfParser.on('pdfParser_dataError', (error) => {
          reject(error)
        })
      })
      
      // Start parsing
      pdfParser.parseBuffer(buffer)
      
      // Wait for parsing to complete
      pdfText = await parsePromise as string
      
      if (!pdfText || pdfText.trim().length === 0) {
        return NextResponse.json(
          { error: 'No text content found in PDF. The PDF might be image-based or scanned.' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('PDF text extraction error:', error)
      return NextResponse.json(
        { error: 'Failed to extract text from PDF. The PDF might be corrupted or password-protected.' },
        { status: 500 }
      )
    }

    console.log('✅ PDF text extraction completed')

    // Step 2: Gemini processes the PDF text and user message
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

    const processingPrompt = `You are a helpful AI assistant that processes PDF content. You receive PDF text and user questions about the PDF. Your job is to:

1. Understand the PDF content provided
2. Answer the user's question about the PDF in a conversational, helpful way
3. Provide insights, summaries, or additional context as needed
4. Keep responses natural and engaging
5. If the user asks for a summary, provide a comprehensive but concise summary
6. If the user asks specific questions, answer them based on the PDF content

Always be helpful, accurate, and conversational in your responses.

Here's the PDF content:

${pdfText}

User's question: ${userMessage}

Please provide a helpful response to the user's question about this PDF.`

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: processingPrompt }] }]
    })
    const finalResponse = result.text || 'Unable to process PDF'
    
    console.log('✅ Gemini processing completed')

    // Step 3: Return the final chat-ready response
    return NextResponse.json({
      response: finalResponse,
      pdfText: pdfText.substring(0, 500) + '...', // Include first 500 chars for debugging
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in PDF analysis pipeline:', error)
    return NextResponse.json(
      { error: 'Internal server error in PDF processing pipeline' },
      { status: 500 }
    )
  }
} 