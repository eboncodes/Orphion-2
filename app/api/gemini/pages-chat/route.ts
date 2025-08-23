import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getAPIKey } from '@/lib/api-keys'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory, model = 'gemini-2.5-flash', stream = false } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let systemPrompt = `You are Orphion Pages AI, a document creation assistant. You help users create documents directly and efficiently.

NEW CAPABILITIES:
- You now have access to code execution tools that allow you to run and test code
- You can use thinking to work through complex problems step-by-step
- When appropriate, you can execute code to demonstrate solutions or verify results
- Use code execution for programming examples, calculations, data analysis, and testing concepts

TOOL USAGE TRANSPARENCY:
- ALWAYS explain what you are going to do before using any tools
- Tell the user why you're using the tool and what you expect to achieve
- For code execution: Explain what the code will do, what problem it solves, and what output to expect
- Example: "I'll run a Python script to calculate the compound interest for your investment scenario. This will help verify the numbers and provide accurate results."
- After tool execution, explain the results and how they relate to the user's request

CORE FUNCTION:
- When users ask you to write or create content, generate it immediately without asking for details
- Write complete, well-structured documents using proper markdown formatting
- Focus on delivering quality content quickly

PAGE CONTENT GENERATION:
- You must use <PAGE> tags when you are given a writing task or asked to create a document.
- This includes tasks like writing reports, proposals, plans, or any other kind of document.
- Examples of when to use <PAGE> tags:
  * "Write a business plan" → <PAGE>Business Plan Content</PAGE>
  * "Create a project proposal" → <PAGE>Project Proposal Content</PAGE>
  * "Draft a technical specification" → <PAGE>Technical Spec Content</PAGE>
  * "Write a report" → <PAGE>Report Content</PAGE>
  * "Create a document" → <PAGE>Document Content</PAGE>
  * "Generate a [specific document type]" → <PAGE>Document Content</PAGE>

IMAGE GENERATION:
- When the user requests an image or visual, wrap ONLY the image prompt in <IMG> tags: <IMG>your descriptive image prompt here</IMG>
- You must generate images with a 16:9 aspect ratio.
- Keep the image prompt concise and descriptive (subject, style, lighting, composition, mood, colors, aspect ratio hints if relevant)
- Do NOT add any other tags inside <IMG> tags
- After generating an image, normal conversation should continue with the standard model. For further modifications to the image, include updated prompts again inside <IMG> tags to preserve context.

REGULAR CONVERSATION:
- For any general queries, questions, analysis, or explanations that are not a writing task, you must respond normally without using <PAGE> tags.
- Examples of regular conversation (NO <PAGE> tags):
  * "What do you think about this?" → Regular response
  * "Can you explain this?" → Regular response
  * "That's good, thanks" → Regular response
  * "How does this work?" → Regular response
  * "Can you help me with..." → Regular response (unless asking for document creation)

RESPONSE STYLE:
- Write in clear, professional language
- Use appropriate document structure with headings and sections when creating documents
- Include proper formatting for readability
- Be concise but comprehensive

STRICT PAGE TAG RULES:
- CRITICAL: Do NOT include any code blocks (code fences), HTML, CSS, JavaScript, or inline scripts inside <PAGE> tags
- Treat <PAGE> as a plain text/markdown document container only (headings, paragraphs, lists, tables)
- If the user requests code, an HTML page, or any executable/markup content, provide that content OUTSIDE of <PAGE> tags
- When the user says "landing page" or "HTML page", do NOT wrap the HTML in <PAGE>; only include a textual brief/spec inside <PAGE> if needed, and return the actual code separately outside <PAGE>
- Never nest <PAGE> tags inside HTML elements or treat <PAGE> as an HTML tag; it is a control marker for the app UI only

IMPORTANT: Only use <PAGE> tags when the user explicitly asks you to CREATE, WRITE, or GENERATE a specific document. For all other conversations, respond normally without <PAGE> tags.`

    // Initialize the GoogleGenAI with your API key
    const geminiApiKey = getAPIKey('gemini')
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not found' },
        { status: 500 }
      )
    }
    
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
    })
    
    const tools = [
      { codeExecution: {} },
    ]
    
    const config = {
      temperature: 0.3,
      maxOutputTokens: 8192,
      maxInputTokens: 32768,
      thinkingConfig: {
        thinkingBudget: 14426,
      },
      tools,
    }

    // Prepare conversation history for Gemini
    const history = conversationHistory ? conversationHistory.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    })) : []

    // Create contents array with system prompt and history
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I\'m Orphion Pages AI, your specialized document creation and editing assistant. I\'m here to help you create, edit, and improve your documents. How can I assist you with your writing today? ✨' }]
      },
      ...history,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ]

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const response = await ai.models.generateContentStream({
              model,
              config,
              contents
            })

            let fullContent = ''
            
            for await (const chunk of response) {
              if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
                continue;
              }
              
              const part = chunk.candidates[0].content.parts[0];
              let chunkText = '';
              let executableCode: any = null;
              let codeExecutionResult: any = null;
              
              if (part.text) {
                chunkText = part.text;
                fullContent += chunkText;
              }
              
              if (part.executableCode) {
                executableCode = part.executableCode;
              }
              
              if (part.codeExecutionResult) {
                codeExecutionResult = part.codeExecutionResult;
              }
              
              if (chunkText || executableCode || codeExecutionResult) {
                // Send the chunk as a server-sent event
                const data = JSON.stringify({
                  type: 'chunk',
                  content: chunkText,
                  executableCode,
                  codeExecutionResult,
                  fullContent: fullContent
                })

                console.log('Sending chunk data:', {
                  type: 'chunk',
                  content: chunkText,
                  contentType: typeof chunkText,
                  executableCode: executableCode ? typeof executableCode : null,
                  codeExecutionResult: codeExecutionResult ? typeof codeExecutionResult : null,
                  fullContent: fullContent
                })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            }

            // Extract page content
            const pageContent = (() => {
              const pageMatch = fullContent.match(/<PAGE>([\s\S]*?)<\/PAGE>/)
              return pageMatch ? pageMatch[1].trim() : null
            })()
            
            // Send completion event
            const completionData = JSON.stringify({
              type: 'complete',
              content: fullContent,
              pageContent: pageContent,
              userPrompt: message,
              aiResponse: fullContent,
              timestamp: new Date(),
              metadata: {
                model,
                processingTime: 0
              }
            })
            
            controller.enqueue(encoder.encode(`data: ${completionData}\n\n`))
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Streaming failed'
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Handle regular response
    const response = await ai.models.generateContent({
      model,
      config,
      contents
    })
    
    const content = response.text || ''
    const executableCode = response.candidates?.[0]?.content?.parts?.[0]?.executableCode || null
    const codeExecutionResult = response.candidates?.[0]?.content?.parts?.[0]?.codeExecutionResult || null
    
    // Extract PAGE content if present
    const pageMatch = content.match(/<PAGE>([\s\S]*?)<\/PAGE>/)
    const pageContent = pageMatch ? pageMatch[1].trim() : null
    
    return NextResponse.json({
      content,
      pageContent,
      executableCode,
      codeExecutionResult,
      userPrompt: message,
      aiResponse: content,
      timestamp: new Date(),
      metadata: {
        model,
        processingTime: 0
      }
    })
  } catch (error) {
    console.error('Error in Pages Gemini API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


