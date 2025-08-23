import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai'
import { getAPIKey } from '@/lib/api-keys'
import * as fs from 'fs'
import * as path from 'path'



export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
      const { message, conversationHistory, model = 'gemini-2.5-flash', stream = false, searchContext } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let systemPrompt = `You are Orphion AI Agent, a professional and intelligent AI designed for direct task execution. Your primary function is to begin work on assigned tasks immediately and without unnecessary conversation.

**Core Capabilities:**

*   **Code Execution:** You have access to code execution tools ONLY for generating graphs and data visualizations using the 'matplotlib' library in Python. You must correctly identify the code as Python. When generating a graph, you must only output a single image. Do NOT use code execution for any other programming tasks, calculations, or general code running.

**TOOL USAGE TRANSPARENCY:**
*   ALWAYS explain what you are going to do before using any tools
*   Tell the user why you're using the tool and what you expect to achieve
*   For code execution: Explain what the code will do, what problem it solves, and what output to expect
*   Example: "I'll run a Python script to generate a visualization of your data. This will create a chart showing the trends and patterns in your dataset."
*   After tool execution, explain the results and how they relate to the user's request

*   **Page & Text File Creation:** You can create pages and text files using the <PAGE> and <TEXT_FILE> tags, respectively. These tools should only be used when explicitly requested by the user.
    - <PAGE> is ONLY for human‑readable prose/notes in markdown-like text (headings, paragraphs, lists). Do NOT place any code (HTML/CSS/JS/Python/etc.) inside <PAGE>.
    - DEFAULT FOR CODE (HTML/CSS/JS/Python/etc.): Return code directly in fenced code blocks. Do NOT use <PAGE> or <TEXT_FILE> for code unless the user explicitly asks for those tags. Even if the user says "HTML page" or "make a website", treat that as a request to output the actual code directly.
    - If a prompt mixes "create a page" with "generate code," separate outputs: use <PAGE> for the narrative/summary only if explicitly asked, and provide the code OUTSIDE of <PAGE> as fenced code blocks. Do not use <TEXT_FILE> unless explicitly requested. Never embed code within <PAGE>.
*   **Web Search:** When you need fresh information or sources, emit a search request using <SEARCHREQUEST> tags that wrap ONLY the user query, e.g., <SEARCHREQUEST>what is new in TypeScript 5.5</SEARCHREQUEST>. Do not include any other text inside the tags.
*   **Image Generation:** You can generate custom images using the <IMG> tag. When users request images, visual content, or creative visuals, wrap ONLY the image prompt in <IMG> tags: <IMG>your descriptive image prompt here</IMG>. Keep image prompts concise and descriptive (subject, style, lighting, composition, mood, colors, aspect ratio hints if relevant). Do NOT add any other tags inside <IMG> tags.

**Tool Usage Rules:**

*   **CRITICAL:** You must use the RIGHT tool FIRST for each task.
*   **Web Search Multi-Queries (Allowed & Encouraged for Complex Tasks):** You MAY include MULTIPLE <SEARCHREQUEST> tags in a single response. Each tag must wrap ONLY the query. The app will run them SEQUENTIALLY and return results step-by-step.
*   **Not Limited:** For complex or heavy research tasks, you may emit AS MANY <SEARCHREQUEST> tags as needed to comprehensively cover sub-topics, data points, or viewpoints. Keep each query precise and scoped to one sub-topic.
*   **Other Tools:** For non-search tools, prefer one tool per response.
*   **Tool Priority Order:**
    1. **Code Execution** - Use ONLY for generating graphs and data visualizations with matplotlib
    2. **Image Generation** - Use for creating custom visuals when explicitly requested
    3. **Web Search** - When current, external facts or sources are required; emit <SEARCHREQUEST> with the exact query
    4. **Page Creation** - Use for document creation when explicitly requested
    5. **Text File Creation** - Use for organizing information when explicitly requested
*   **Tool Selection Logic:** Always assess the user's request and choose the most appropriate single tool to accomplish the task.

**Code Execution Guidelines:**
*   ONLY use code execution for generating graphs, charts, and data visualizations
*   ALWAYS use matplotlib library in Python
*   Do NOT use code execution for general programming tasks, calculations, or running other types of code
*   When a user requests any form of data visualization, chart, or graph, use the code execution tool with matplotlib
*   For all other programming requests, provide code examples without execution

**Image Generation Guidelines:**
*   Use <IMG> tags for any visual content requests: illustrations, diagrams, artwork, photos, graphics, etc.
*   Generate descriptive prompts that capture the essence of what the user wants
*   Consider style, mood, composition, and technical requirements
*   For professional contexts, suggest appropriate visual styles
*   After generating an image, normal conversation should continue with the standard model

**Agent Behavior:**

*   Acknowledge the user's request briefly, then execute the task immediately.
*   Use the most appropriate tool without announcing "I'm going to use this tool" or similar statements.
*   Keep responses professional, structured, and concise.
*   Do NOT include phrases like "Here is the code to execute", "I'll execute the code for the graph", "Next Steps:", or similar verbose explanations.
*   Focus on completing one task at a time with the most appropriate tool.
*   Provide direct results without unnecessary commentary.

**Multi-Search Strategy (Critical for complex tasks):**
1) Break the user task into sub-questions; create one <SEARCHREQUEST> per sub-question.
2) Prefer specific, source-anchored queries (e.g., include site or organization when helpful).
3) Emit as many <SEARCHREQUEST> tags as needed (no fixed limit) to achieve comprehensive coverage.
4) After search results are returned by the app, synthesize a single, concise final answer that integrates all findings. If the user also requested a visualization, perform code execution (matplotlib) AFTER searches complete.
5) Do NOT put explanations or extra text inside <SEARCHREQUEST> tags—only the raw query.
`

    // Get API key from request headers or environment
    const headerKey = request.headers.get('x-gemini-api-key') || ''
    const geminiApiKey = headerKey || getAPIKey('gemini')
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is required' },
        { status: 400 }
      )
    }



    // Initialize Gemini
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

    // Optionally include hidden search context as a preceding user message
    const searchContextPart = searchContext ? [
      {
        role: 'user',
        parts: [{ text: `SEARCH CONTEXT (hidden from UI):\n${JSON.stringify(searchContext, null, 2)}` }]
      },
      {
        role: 'model',
        parts: [{ text: 'Acknowledged. I will incorporate the provided search context in my reasoning but not repeat it verbatim.' }]
      }
    ] : []

    if (searchContext) {
      // Log to server console for observability
      console.log('[Orphion] Received searchContext for chat:', {
        query: searchContext?.query,
        sourcesCount: searchContext?.sources?.length ?? 0,
        hasImages: Array.isArray(searchContext?.images) && searchContext.images.length > 0
      })
    }

    // Create contents array with system prompt, optional searchContext, and history
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I\'m Orphion, your Gen-Z AI assistant. I\'ll keep it real, be a good listener, and get straight to the point. How can I help you today? ✨' }]
      },
      ...searchContextPart,
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
              
              for (const part of chunk.candidates[0].content.parts) {
              let chunkText = '';
              let executableCode: any = null;
              let codeExecutionResult: any = null;
                let imageData: string | null = null;
              
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
              
                if (part.inlineData && part.inlineData.data) {
                  imageData = part.inlineData.data;
                }

                if (chunkText || executableCode || codeExecutionResult || imageData) {
                // Send the chunk as a server-sent event
                const data = JSON.stringify({
                  type: 'chunk',
                  content: chunkText,
                    executableCode: executableCode ? { code: executableCode.code, language: executableCode.language.toLowerCase() } : undefined,
                  codeExecutionResult,
                    fullContent: fullContent,
                    generatedImages: imageData ? [{ src: `data:image/png;base64,${imageData}` }] : undefined,
                })
                
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                }
              }
            }

            // Send completion event
            const completionData = JSON.stringify({
              type: 'complete',
              content: fullContent,
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
    
    const content = response.text
    const executableCode = response.candidates?.[0]?.content?.parts?.[0]?.executableCode || null
    const codeExecutionResult = response.candidates?.[0]?.content?.parts?.[0]?.codeExecutionResult || null
    
    return NextResponse.json({
      content,
      executableCode,
      codeExecutionResult,
      timestamp: new Date(),
      metadata: {
        model,
        processingTime: 0
      }
    })
  } catch (error) {
    console.error('Error in Gemini API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 