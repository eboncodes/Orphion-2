import { useCallback, useEffect, useRef } from 'react'
import { generateUniqueId } from '@/lib/utils'
import { orphionAIService } from '@/app/services/OrphionAIService'
import { chatTitleService } from '@/app/services/ChatTitleService'
import { ChatMessage } from '@/lib/chat-storage'
import { useTTS } from '@/hooks/useTTS'
import { useFileAnalysis } from '@/hooks/useFileAnalysis'
import { useWebSearch } from '@/hooks/useWebSearch'

type Message = ChatMessage

interface UseMessageSenderProps {
  messages: Message[]
  message: string
  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null
  selectedTool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | null
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  setMessage: (message: string) => void
  setAttachedFile: (file: any) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  updateMessageInStorage: (messageId: string, updates: Partial<Message>) => void
  saveMessageToStorage: (message: Message, conversationId?: string) => Promise<void>
  createNewConversation: () => string
  currentConversationId: string | null
  onTitleGenerated: (title: string) => void
}

export function useMessageSender({
  messages,
  message,
  attachedFile,
  selectedTool,
  isLoading,
  setIsLoading,
  setMessage,
  setAttachedFile,
  addMessage,
  updateMessage,
  updateMessageInStorage,
  saveMessageToStorage,
  createNewConversation,
  currentConversationId,
  onTitleGenerated
}: UseMessageSenderProps) {
  const { analyzeFile } = useFileAnalysis()
  const isStreaming = useRef(false)

  useEffect(() => {
    return () => {
      if (isStreaming.current) {
        // Cleanup logic if component unmounts during streaming
      }
    }
  }, [])

  // Process function calls and special tags
  const processFunctionCalls = useCallback(async (
    content: string,
    aiMessageId: string,
    searchAlreadyTriggered: boolean = false,
    historyOverride?: Array<{ role: string, content: string }>
  ) => {
    const functionCallRegex = /<FUNCTION_CALL>([^<]+)<\/FUNCTION_CALL>/gi
    let match
    let processedContent = content

    // Process function calls
    while ((match = functionCallRegex.exec(content)) !== null) {
      const functionCall = match[1]
      
      // Parse function call
      if (functionCall.includes('create_text_file(')) {
        const fileMatch = functionCall.match(/create_text_file\(name="([^"]+)", content="([^"]+)"\)/)
        if (fileMatch) {
          const fileName = fileMatch[1]
          const fileContent = fileMatch[2]
          
          try {
            // Create a Blob from the content
            const blob = new Blob([fileContent], { type: 'text/plain' })
            
            // Create a temporary link to trigger the download
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = fileName
            
            // Append to the document, click, and then remove
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            // Clean up the URL object
            URL.revokeObjectURL(link.href)
            
            // Update the message to indicate success
            updateMessage(aiMessageId, { 
              content: `✅ Successfully created and downloaded '${fileName}'.`
            })
            
          } catch (error) {
            console.error('Error creating text file:', error)
            updateMessage(aiMessageId, { 
              content: `❌ Failed to create text file. Please try again.`
            })
          }
          
          // Remove function call from content
          processedContent = processedContent.replace(match[0], '')
        }
      }
    }

    // Process SEARCHREQUEST tags -> trigger Tavily search and UI updates
    let searchMatch = processedContent.match(/<(SEARCHREQUEST|SEARCH_REQUEST|SEARCH|WEBSEARCH|WEB_SEARCH)>([\s\S]*?)<\/\1>/i)
    // Fallback manual detection if regex fails but tag text exists
    if (!searchMatch) {
      const candidates = ['SEARCHREQUEST','SEARCH_REQUEST','SEARCH','WEBSEARCH','WEB_SEARCH']
      const upper = processedContent.toUpperCase()
      for (const tag of candidates) {
        const openToken = `<${tag}>`
        const closeToken = `</${tag}>`
        const openIdx = upper.indexOf(openToken)
        const closeIdx = upper.indexOf(closeToken)
        if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
          const inner = processedContent.substring(openIdx + openToken.length, closeIdx)
          searchMatch = [processedContent.substring(openIdx, closeIdx + closeToken.length), tag, inner] as unknown as RegExpMatchArray
          break
        }
      }
    }
    if (searchMatch && !searchAlreadyTriggered) {
      const searchQuery = searchMatch[2].trim()

      // Show pill on the current AI message
      console.log('[Orphion] Detected search tag with query:', searchQuery)
      updateMessage(aiMessageId, { searchRequest: searchQuery, searchCompleted: false })
      updateMessageInStorage(aiMessageId, { searchRequest: searchQuery, searchCompleted: false })

      try {
        const results = await orphionAIService.searchWeb(searchQuery)
        console.log('[Orphion] Tavily results received:', results)

        // Mark pill as completed
        updateMessage(aiMessageId, { searchCompleted: true })
        updateMessageInStorage(aiMessageId, { searchCompleted: true })

        // Attach search results to the same AI message that shows the pill
        updateMessage(aiMessageId, {
          usedWebSearch: true,
          searchResults: {
            answer: results.answer,
            sources: results.sources,
            images: results.images,
            query: results.query
          }
        })
        updateMessageInStorage(aiMessageId, {
          usedWebSearch: true,
          searchResults: {
            answer: results.answer,
            sources: results.sources,
            images: results.images,
            query: results.query
          }
        })

        // Send search context hidden to main chat route to produce a final answer
        try {
          const history = historyOverride || messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content }))
          const finalResponse = await orphionAIService.sendMessageWithContext(
            'Using the hidden search context, synthesize a final answer to the user. Do not expose the context itself.',
            history,
            undefined,
            {
              query: results.query,
              answer: results.answer,
              sources: results.sources,
              images: results.images,
            }
          )

          const finalMessage: Message = {
            id: generateUniqueId('ai'),
            content: finalResponse.content,
            sender: 'ai',
            timestamp: new Date(),
          }
          addMessage(finalMessage)
          // Persist final message
          try {
            await saveMessageToStorage(finalMessage)
          } catch {}

          // Persist image-gen if <IMG> present in final
          try {
            const imgMatch = finalResponse.content.match(/<IMG>([\s\S]*?)<\/IMG>/i)
            if (imgMatch) {
              const prompt = imgMatch[1].trim()
              updateMessage(finalMessage.id, { imagePrompt: prompt, imageGenerationCompleted: false })
              updateMessageInStorage(finalMessage.id, { imagePrompt: prompt, imageGenerationCompleted: false } as any)
              const gen = await orphionAIService.generateImage(prompt)
              updateMessage(finalMessage.id, { imageGenerationCompleted: true, generatedImages: gen.images })
              updateMessageInStorage(finalMessage.id, { imageGenerationCompleted: true, generatedImages: gen.images } as any)
            }
          } catch (imgErr) {
            console.error('Finalization image generation failed:', imgErr)
            updateMessage(finalMessage.id, { imageGenerationCompleted: true, imageGenerationError: true })
            updateMessageInStorage(finalMessage.id, { imageGenerationCompleted: true, imageGenerationError: true } as any)
          }

          // Detect <IMG> tags in the final answer and trigger image generation
          try {
            const imgMatch = finalResponse.content.match(/<IMG>([\s\S]*?)<\/IMG>/i)
            if (imgMatch) {
              const prompt = imgMatch[1].trim()
              updateMessage(finalMessage.id, { imagePrompt: prompt, imageGenerationCompleted: false })
              const gen = await orphionAIService.generateImage(prompt)
              updateMessage(finalMessage.id, { imageGenerationCompleted: true, generatedImages: gen.images })
            }
          } catch (imgErr) {
            console.error('Finalization image generation failed:', imgErr)
            updateMessage(finalMessage.id, { imageGenerationCompleted: true, imageGenerationError: true })
          }
        } catch (finalError) {
          console.error('Finalization error:', finalError)
        }
      } catch (err) {
        console.error('Search error:', err)
        updateMessage(aiMessageId, { searchCompleted: true, searchError: true })
        updateMessageInStorage(aiMessageId, { searchCompleted: true, searchError: true })
      }

      // Remove tag from display
      processedContent = processedContent.replace(searchMatch[0], '')
    }

    // Process PAGE tags
    const pageMatch = processedContent.match(/<PAGE>([\s\S]*?)<\/PAGE>/)
    if (pageMatch) {
      const pageContent = pageMatch[1].trim()
      
      // Extract title from page content
      const getTitle = (text: string) => {
        const cleanText = text
          .replace(/^#+\s*/gm, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/`(.*?)`/g, '$1') // Remove code
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        
        const lines = cleanText.split('\n')
        const firstLine = lines[0].trim()
        if (firstLine.length > 50) {
          return firstLine.substring(0, 50) + '...'
        }
        return firstLine || 'Document Content'
      }
      
      const pageTitle = getTitle(pageContent)
      
      try {
        // Import page storage functions
        const { createPageConversation, updatePageConversation } = await import('@/lib/page-storage')
        
        // Create a new page conversation
        const newPage = createPageConversation(pageTitle, 'gemini-2.5-flash')
        
        // Update the page with content
        updatePageConversation(newPage.id, { pageContent })
        
        // Update the message to include the page ID in the content for the pill to use
        updateMessage(aiMessageId, { 
          content: `✅ Successfully created page: "${pageTitle}". Click the page pill to open it.`,
          pageId: newPage.id // Add page ID to the message
        })
        
        // Dispatch custom event to notify components of page creation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('page-created', { 
            detail: { pageId: newPage.id, pageTitle, pageContent } 
          }))
        }
        
      } catch (error) {
        console.error('Error creating page:', error)
        updateMessage(aiMessageId, { 
          content: `❌ Failed to create page. Please try again.`
        })
      }
    }

    // Process IMG tags -> trigger image generation
    let imgMatch = processedContent.match(/<IMG>([\s\S]*?)<\/IMG>/i)
    if (imgMatch) {
      const prompt = imgMatch[1].trim()
      try {
        updateMessage(aiMessageId, { imagePrompt: prompt, imageGenerationCompleted: false })
        updateMessageInStorage(aiMessageId, { imagePrompt: prompt, imageGenerationCompleted: false })
        const result = await orphionAIService.generateImage(prompt)
        const updates = {
          imageGenerationCompleted: true,
          generatedImages: result.images,
        }
        updateMessage(aiMessageId, updates)
        updateMessageInStorage(aiMessageId, updates)
      } catch (e) {
        const updates = { imageGenerationCompleted: true, imageGenerationError: true }
        updateMessage(aiMessageId, updates)
        updateMessageInStorage(aiMessageId, updates)
      }
      processedContent = processedContent.replace(imgMatch[0], '')
    }

    return processedContent
  }, [updateMessage])

  const sendMessageInternal = useCallback(async () => {
    if ((!message.trim() && !attachedFile) || isLoading) return

    // Don't create conversation yet - wait for AI response
    let conversationId = currentConversationId
    let shouldCreateConversation = false
    
    if (messages.length === 0 || !currentConversationId) {
      shouldCreateConversation = true
      // Create a temporary conversation ID for now
      conversationId = `temp_${Date.now()}`
    }

    const userMessage: Message = {
      id: generateUniqueId('user'),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      attachedFile: attachedFile ? {
        file: attachedFile.file,
        preview: attachedFile.preview,
        type: attachedFile.type
      } : undefined
    }

    addMessage(userMessage)
    
    // If we have an existing conversation, save the user message immediately
    if (conversationId && !shouldCreateConversation) {
      await saveMessageToStorage(userMessage, conversationId)
    }
    
    const currentMessage = message.trim()
    setMessage("")
    setAttachedFile(null)
    setIsLoading(true)

    const startTime = Date.now()

    try {
      // Handle file analysis if file is attached
      if (attachedFile) {
        try {
          const analysisResponse = await analyzeFile(attachedFile.file, currentMessage)
          
          // Create AI message with the analysis response
          const aiMessageId = generateUniqueId('ai')
          const aiMessage: Message = {
            id: aiMessageId,
            content: analysisResponse,
            sender: 'ai',
            timestamp: new Date(),
            responseTime: Math.round((Date.now() - startTime) / 1000),
            usedWebSearch: false
          }
          
          addMessage(aiMessage)
          
          // Now create the conversation and save both messages
          if (shouldCreateConversation) {
            conversationId = createNewConversation()
          }
          
          // Save both messages to localStorage
          if (conversationId && conversationId !== `temp_${Date.now()}`) {
            if (shouldCreateConversation) {
              await saveMessageToStorage(userMessage, conversationId)
            }
            await saveMessageToStorage(aiMessage, conversationId)
          }
          
          setIsLoading(false)
          return
        } catch (error) {
          console.error('File analysis error:', error)
          
          // Add error message to the conversation
          const errorResponse: Message = {
            id: generateUniqueId('ai'),
            content: `❌ File analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sender: 'ai',
            timestamp: new Date(),
            responseTime: 0
          }
          
          addMessage(errorResponse)
          
          // Now create the conversation and save messages
          if (shouldCreateConversation) {
            conversationId = createNewConversation()
          }
          
          // Save messages to localStorage
          if (conversationId && conversationId !== `temp_${Date.now()}`) {
            if (shouldCreateConversation) {
              await saveMessageToStorage(userMessage, conversationId)
            }
            await saveMessageToStorage(errorResponse, conversationId)
          }
          
          setIsLoading(false)
          return
        }
      }

      // Regular chat message handling
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // Create AI message placeholder
      const aiMessageId = generateUniqueId('ai')
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date()
      }

      // Add AI message placeholder to UI
      addMessage(aiMessage)
      isStreaming.current = true

      // Stream message with real-time updates
      let fullContent = ''
      let lastUpdateTime = 0
      let updateTimeout: NodeJS.Timeout | null = null
      let searchTriggered = false
      let imageTriggered = false

      const tryTriggerSearchFromContent = async () => {
        if (searchTriggered) return
        let m = fullContent.match(/<(SEARCHREQUEST|SEARCH_REQUEST|SEARCH|WEBSEARCH|WEB_SEARCH)>([\s\S]*?)<\/\1>/i)
        // Fallback manual detection
        if (!m) {
          const upper = fullContent.toUpperCase()
          const candidates = ['SEARCHREQUEST','SEARCH_REQUEST','SEARCH','WEBSEARCH','WEB_SEARCH']
          for (const tag of candidates) {
            const openToken = `<${tag}>`
            const closeToken = `</${tag}>`
            const openIdx = upper.indexOf(openToken)
            const closeIdx = upper.indexOf(closeToken)
            if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
              const inner = fullContent.substring(openIdx + openToken.length, closeIdx)
              m = [fullContent.substring(openIdx, closeIdx + closeToken.length), tag, inner] as unknown as RegExpMatchArray
              break
            }
          }
        }
        if (m) {
          searchTriggered = true
          const q = m[2].trim()
          console.log('[Orphion] Streaming detected search tag:', q)
          try {
            updateMessage(aiMessageId, { searchRequest: q, searchCompleted: false })
            const results = await orphionAIService.searchWeb(q)
            updateMessage(aiMessageId, { searchCompleted: true })
            updateMessage(aiMessageId, {
              usedWebSearch: true,
              searchResults: {
                answer: results.answer,
                sources: results.sources,
                images: results.images,
                query: results.query
              }
            })
            updateMessageInStorage(aiMessageId, {
              usedWebSearch: true,
              searchResults: {
                answer: results.answer,
                sources: results.sources,
                images: results.images,
                query: results.query
              }
            })
            const history = [...messages, userMessage].map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content }))
            const wantsViz = /\b(plot|graph|chart|visuali[sz]e|bar chart|line chart|scatter)\b/i.test(userMessage.content)
            if (wantsViz) {
              // auto-trigger code execution streaming with hidden context
              updateMessage(aiMessageId, { codeExecuting: true })
              let execCode: any | undefined = undefined
              await orphionAIService.streamMessage(
                'Using the hidden search context, generate the requested visualization using Python matplotlib. Produce executable Python code and run it with the code execution tool to return a single PNG image. Do not restate the context.',
                history,
                (chunk: any) => {
                  if (chunk.executableCode) execCode = chunk.executableCode
                  updateMessage(aiMessageId, {
                    executableCode: execCode || ({} as any),
                    ...(Array.isArray(chunk.generatedImages) ? { generatedImages: chunk.generatedImages, codeExecuted: true, codeExecuting: false } : { codeExecuting: !!execCode })
                  })
                },
                undefined,
                {
                  query: results.query,
                  answer: results.answer,
                  sources: results.sources,
                  images: results.images,
                }
              )
              // finalize flags in case no image was emitted
              updateMessage(aiMessageId, { codeExecuting: false, codeExecuted: true })
            } else {
              const finalResponse = await orphionAIService.sendMessageWithContext(
                'Using the hidden search context, synthesize a final answer to the user. Do not expose the context itself.',
                history,
                undefined,
                {
                  query: results.query,
                  answer: results.answer,
                  sources: results.sources,
                  images: results.images,
                }
              )
              addMessage({
                id: generateUniqueId('ai'),
                content: finalResponse.content,
                sender: 'ai',
                timestamp: new Date(),
              })
            }
          } catch (err) {
            console.error('Streaming search error:', err)
            updateMessage(aiMessageId, { searchCompleted: true, searchError: true })
          }
        }
      }

      const tryTriggerImageFromContent = async () => {
        if (imageTriggered) return
        const m = fullContent.match(/<IMG>([\s\S]*?)<\/IMG>/i)
        if (m) {
          imageTriggered = true
          const prompt = m[1].trim()
          try {
            updateMessage(aiMessageId, { imagePrompt: prompt, imageGenerationCompleted: false })
            updateMessageInStorage(aiMessageId, { imagePrompt: prompt, imageGenerationCompleted: false })
            const result = await orphionAIService.generateImage(prompt)
            const updates = { imageGenerationCompleted: true, generatedImages: result.images }
            updateMessage(aiMessageId, updates)
            updateMessageInStorage(aiMessageId, updates)
          } catch (err) {
            console.error('Streaming image generation error:', err)
            const updates = { imageGenerationCompleted: true, imageGenerationError: true }
            updateMessage(aiMessageId, updates)
            updateMessageInStorage(aiMessageId, updates)
          }
        }
      }

      try {
        await orphionAIService.streamMessage(currentMessage, conversationHistory, async (data: any) => {
          const chunkText = typeof data === 'string' ? data : (data?.content ?? '')
          if (chunkText) {
            fullContent += chunkText
          }
          
          const now = Date.now()
          const timeSinceLastUpdate = now - lastUpdateTime
          
          // Clear any pending update
          if (updateTimeout) {
            clearTimeout(updateTimeout)
          }
          
          // Throttle updates to 60fps for smooth animation
          if (timeSinceLastUpdate >= 16) { // ~60fps
            updateMessage(aiMessageId, { 
              content: fullContent,
              // Attach generated images from code execution during stream
              ...(Array.isArray(data?.generatedImages) ? { generatedImages: data.generatedImages } : {}),
              // Code execution flags based on presence of executableCode and generatedImages
              ...(data?.executableCode ? { executableCode: data.executableCode, codeExecuting: !Array.isArray(data?.generatedImages) } : {}),
              ...(Array.isArray(data?.generatedImages) ? { codeExecuted: true, codeExecuting: false } : {})
            })
            lastUpdateTime = now
          } else {
            // Schedule update if not throttled
            updateTimeout = setTimeout(() => {
              updateMessage(aiMessageId, { 
                content: fullContent,
                ...(Array.isArray(data?.generatedImages) ? { generatedImages: data.generatedImages } : {}),
                ...(data?.executableCode ? { executableCode: data.executableCode, codeExecuting: !Array.isArray(data?.generatedImages) } : {}),
                ...(Array.isArray(data?.generatedImages) ? { codeExecuted: true, codeExecuting: false } : {})
              })
              lastUpdateTime = Date.now()
            }, 16 - timeSinceLastUpdate)
          }
          // Try to trigger search and image generation as soon as tags appear
          tryTriggerSearchFromContent()
          tryTriggerImageFromContent()
        })

        // Ensure final content is set
        updateMessage(aiMessageId, { content: fullContent })
        isStreaming.current = false

        const effectiveHistory = [...messages, userMessage].map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content }))
        const processedContent = await processFunctionCalls(fullContent, aiMessageId, searchTriggered, effectiveHistory)

        updateMessage(aiMessageId, { 
          content: processedContent,
          responseTime: Math.round((Date.now() - (parseInt(aiMessageId) - 1)) / 1000)
        })

        // To save the final message, we need to get its latest state from the messages array
        const finalMessageState = messages.find(m => m.id === aiMessageId)
        const finalAIMessage = {
          ...aiMessage,
          ...finalMessageState,
          content: processedContent,
        }

      // Now create the conversation and save messages
      if (shouldCreateConversation) {
        conversationId = createNewConversation()

          // Generate and persist title right after conversation creation
          try {
            const titleResult = await chatTitleService.generateTitle(currentMessage, fullContent)
            onTitleGenerated?.(titleResult.title)

            // Persist to storage so Sidebar picks it up
            if (conversationId) {
              const { updateConversation } = await import('@/lib/chat-storage')
              updateConversation(conversationId, { title: titleResult.title })
            }
          } catch (titleError) {
            console.error('Title generation failed:', titleError)
          }
      }

      // Save final AI message
      if (conversationId && conversationId !== `temp_${Date.now()}`) {
        if (shouldCreateConversation) {
          await saveMessageToStorage(userMessage, conversationId)
        }
        await saveMessageToStorage(finalAIMessage, conversationId)
      }
      } catch (streamError) {
        console.error('Streaming error:', streamError)
        isStreaming.current = false
        
        // Update message with error
        updateMessage(aiMessageId, { 
          content: 'Sorry, I encountered an error while streaming. Please try again.' 
        })
        
        // Save error message
        if (conversationId && conversationId !== `temp_${Date.now()}`) {
          if (shouldCreateConversation) {
            await saveMessageToStorage(userMessage, conversationId)
          }
          await saveMessageToStorage({ ...aiMessage, content: 'Sorry, I encountered an error while streaming. Please try again.' }, conversationId)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: generateUniqueId('ai'),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        responseTime: 0
      }
      
      addMessage(errorMessage)
      
      // Now create the conversation and save messages
      if (shouldCreateConversation) {
        conversationId = createNewConversation()
      }
      
      if (conversationId && conversationId !== `temp_${Date.now()}`) {
        if (shouldCreateConversation) {
          await saveMessageToStorage(userMessage, conversationId)
        }
        await saveMessageToStorage(errorMessage, conversationId)
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    message,
    attachedFile,
    selectedTool,
    isLoading,
    messages,
    currentConversationId,
    setMessage,
    setAttachedFile,
    setIsLoading,
    addMessage,
    updateMessage,
    saveMessageToStorage,
    createNewConversation,
    analyzeFile,
    processFunctionCalls,
    onTitleGenerated
  ])

  return {
    sendMessageInternal,
    processFunctionCalls
  }
} 