"use client"

import { useState, useRef, useEffect } from "react"
import SidebarOverlay from "../SidebarOverlay"
import MessageBoxUI from "../../message/MessageBoxUI"
import ConversationUI from "../../chat/ConversationUI"
import SettingsPopup from "../../ui/SettingsPopup"
import { orphionAIService } from "@/app/services/OrphionAIService"
import { chatTitleService } from "@/app/services/ChatTitleService"
import { getAPIKey } from "@/lib/api-keys"
import { createConversation, addMessageToConversation, updateConversation, updateMessageInConversation } from "@/lib/chat-storage"
import { DashboardContentProps, ToolType, FileAttachment } from "./types"
import { useDashboardState } from "./hooks"

import { getPlaceholderText, handlePageNavigation, createErrorContent, createFallbackContent } from "./utils"
import { generateUniqueId } from '@/lib/utils'

export default function DashboardContentModular({
  sidebarOpen,
  sidebarDocked,
  closeTimeout,
  showSettings,
  chatKey,
  messages,
  currentConversationId,
  conversationTitle,
  isFavorite,
  onToggleSidebar,
  onToggleDock,
  onCloseSidebar,
  onSetCloseTimeout,
  onMessagesUpdate,
  onToggleFavorite,
  onNewChat,
  onConversationCreated,
  onTitleGenerated,
  onCloseSettings,
  onPageCreated
}: DashboardContentProps) {
  
  // Local state for message input
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null)
  const [selectedTool, setSelectedTool] = useState<ToolType>(null)
  const hasRehydratedRef = useRef(false)
  
  // Refs for components
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use custom hooks
  const { localMessages, setLocalMessages, latestAIMessage, handleLocalMessagesUpdate } = useDashboardState(messages, onMessagesUpdate)

  // Helper functions
  const createUserMessage = (content: string, attachedFile?: any) => ({
    id: generateUniqueId('user'),
    content: content.trim(),
    sender: 'user' as const,
    timestamp: new Date(),
    attachedFile: attachedFile || undefined
  })

  const createAIMessage = () => ({
    id: generateUniqueId('ai'),
    content: '',
    sender: 'ai' as const,
    timestamp: new Date()
  })

  const handleFileAnalysis = async (attachedFile: any, message: string) => {
    try {
      console.log('Analyzing attached file:', attachedFile.type)
      
      let fileAnalysisResult: any
      switch (attachedFile.type) {
        case 'image':
          fileAnalysisResult = await orphionAIService.analyzeImage(attachedFile.file, message.trim())
          break
        case 'pdf':
          fileAnalysisResult = await orphionAIService.analyzePDF(attachedFile.file, message.trim())
          break
        case 'document':
          fileAnalysisResult = await orphionAIService.analyzeDocument(attachedFile.file, message.trim())
          break
        case 'excel':
        case 'csv':
          fileAnalysisResult = await orphionAIService.analyzeExcel(attachedFile.file, message.trim())
          break
        default:
          throw new Error(`Unsupported file type: ${attachedFile.type}`)
      }
      
      const enhancedMessage = `File Analysis Results:\n${fileAnalysisResult.response}\n\nUser Question: ${message.trim()}`
      console.log('File analysis completed, enhanced message:', enhancedMessage)
      return enhancedMessage
      
    } catch (fileError) {
      console.error('File analysis failed:', fileError)
      return `Note: File analysis failed for ${attachedFile.type} file. ${message.trim()}`
    }
  }



  const generateConversationTitle = async (enhancedMessage: string, fullContent: string, conversationId: string, onTitleGenerated: (title: string) => void) => {
    try {
      const titleResult = await chatTitleService.generateTitleWithIcon(enhancedMessage, fullContent)
      if (titleResult.title) {
        onTitleGenerated(titleResult.title)
        // Update conversation title and icon in storage
        if (conversationId) {
          updateConversation(conversationId, { 
            title: titleResult.title,
            icon: titleResult.icon,
            iconName: titleResult.iconName
          })
        }
      }
    } catch (titleError) {
      console.error('Title generation error:', titleError)
      // Don't fail the whole conversation if title generation fails
    }
  }

  // Rehydrate search results and generated images when re-entering a conversation
  useEffect(() => {
    if (hasRehydratedRef.current) return
    if (!Array.isArray(localMessages) || localMessages.length === 0) return

    let didWork = false
    const run = async () => {
      const updates: Array<Promise<void>> = []
      localMessages.forEach((msg) => {
        if (!msg || msg.sender !== 'ai') return

        // Rehydrate single search
        if (msg.searchRequest && msg.searchCompleted && !msg.searchResults) {
          didWork = true
          updates.push((async () => {
            try {
              const res = await orphionAIService.searchWeb(msg.searchRequest as string)
              setLocalMessages(prev => prev.map(m => m.id === msg.id ? ({
                ...m,
                usedWebSearch: true,
                searchResults: {
                  answer: res.answer,
                  sources: res.sources,
                  images: res.images,
                  query: res.query,
                }
              }) : m))
              if (currentConversationId) {
                try {
                  updateMessageInConversation(currentConversationId, msg.id, {
                    usedWebSearch: true,
                    searchResults: {
                      answer: res.answer,
                      sources: res.sources,
                      images: res.images,
                      query: res.query,
                    }
                  } as any)
                } catch {}
              }
            } catch {}
          })())
        }

        // Rehydrate multi-search missing results
        if (Array.isArray(msg.multiSearch)) {
          msg.multiSearch.forEach((item: any, idx: number) => {
            if (item?.completed && !item?.results && item?.query) {
              didWork = true
              updates.push((async () => {
                try {
                  const res = await orphionAIService.searchWeb(item.query as string)
                  setLocalMessages(prev => prev.map(m => {
                    if (m.id !== msg.id) return m
                    const ms = Array.isArray((m as any).multiSearch) ? ([...(m as any).multiSearch] as any[]) : []
                    if (ms[idx]) {
                      ms[idx] = {
                        ...ms[idx],
                        results: {
                          answer: res.answer,
                          sources: res.sources,
                          images: res.images,
                          query: res.query,
                        }
                      }
                    }
                    if (currentConversationId) {
                      try { updateMessageInConversation(currentConversationId, msg.id, { multiSearch: ms } as any) } catch {}
                    }
                    return { ...m, multiSearch: ms }
                  }))
                } catch {}
              })())
            }
          })
        }

        
      })

      if (updates.length > 0) {
        try { await Promise.allSettled(updates) } catch {}
      }
      hasRehydratedRef.current = true
    }

    run()
  }, [localMessages, currentConversationId, setLocalMessages])

  // Message handlers
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() && !attachedFile) return
    
    // Create new conversation if this is the first message or if no current conversation
    let conversationId = currentConversationId
    if (localMessages.length === 0 || !currentConversationId) {
      console.log('Creating new conversation...')
      const newConversation = createConversation('New Chat', 'gemini-2.5-flash')
      console.log('New conversation created:', newConversation.id)
      conversationId = newConversation.id
      onConversationCreated(newConversation.id)
      console.log('Notified parent of new conversation:', newConversation.id)
    } else {
      console.log('Using existing conversation:', conversationId)
    }
    
    // Add user message to messages
    const userMessage = createUserMessage(message, attachedFile)
    const newMessages = [...localMessages, userMessage]
    handleLocalMessagesUpdate(newMessages)
    
    // Save user message to conversation storage
    if (conversationId) {
      console.log('Saving user message to conversation:', conversationId)
      await addMessageToConversation(conversationId, userMessage)
      console.log('User message saved successfully')
    } else {
      console.error('No conversation ID available for saving user message')
    }
    
    // Clear input and tool after send
    setMessage("")
    setAttachedFile(null)
    setSelectedTool(null)
    
    // Set loading state
    setIsLoading(true)
    
    try {
      // Create AI message placeholder
      const aiMessage = createAIMessage()
      latestAIMessage.current = aiMessage
      
      // Add AI message placeholder
      const messagesWithAI = [...newMessages, aiMessage]
      handleLocalMessagesUpdate(messagesWithAI)
      
      // Prepare conversation history for AI (excluding the current user message to avoid duplication)
      const conversationHistory = localMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
      
      // Get AI response
      let fullContent = ''

      let accumulatedExecutableCode: any | undefined = undefined
      
      // Handle file analysis if there's an attached file
      let enhancedMessage = message.trim()

      
      if (attachedFile) {
        enhancedMessage = await handleFileAnalysis(attachedFile, message)
      }
      
      // Try streaming first
      try {
        console.log('Starting streaming with enhanced message:', enhancedMessage)
        console.log('Conversation history:', conversationHistory)
        
        await orphionAIService.streamMessage(
          enhancedMessage,
          conversationHistory,
          (chunk: any) => {
            console.log('Received chunk:', chunk)
            
            // Handle different types of chunks
            if (typeof chunk === 'string') {
              fullContent += chunk
            } else if (typeof chunk === 'object' && chunk.content) {
              fullContent += chunk.content
            }
            


            if (chunk.executableCode) {
              accumulatedExecutableCode = chunk.executableCode
            }


            

            
            // Update streaming content for the reasoning bar using a state updater function
            setLocalMessages(prevMessages => {
              const updatedMessages = prevMessages.map(msg => {
                if (msg.id === aiMessage.id) {
                                     const updatedAIMessage = {
                     ...msg,
                     content: fullContent,


                     executableCode: accumulatedExecutableCode || msg.executableCode,
                     // Attach generated images from code execution (matplotlib)
                     generatedImages: Array.isArray(chunk.generatedImages)
                       ? chunk.generatedImages
                       : msg.generatedImages,
                     codeExecuting: !!accumulatedExecutableCode && !Array.isArray(chunk.generatedImages),
                     codeExecuted: Array.isArray(chunk.generatedImages) ? true : msg.codeExecuted,
                   }
                  latestAIMessage.current = updatedAIMessage // Update ref with latest message state
                  return updatedAIMessage
                }
                return msg
              })
              return updatedMessages
            })
          },
          'gemini-2.5-flash'
        )
        
        console.log('Streaming completed, final content:', fullContent)

        // Finalize the message using the latest state from the ref
        const finalAIMessage = {
          ...latestAIMessage.current,
          content: fullContent,
        }
        console.log('Finalizing message:', finalAIMessage)

        setLocalMessages(prevMessages => {
          const finalMessages = prevMessages.map(msg =>
            msg.id === aiMessage.id ? finalAIMessage : msg
          )
          return finalMessages
        })

        // Save AI message to conversation storage
        if (conversationId) {
          await addMessageToConversation(conversationId, finalAIMessage)
        }
        
        // Generate title for new conversations
        if (newMessages.length === 1 && !currentConversationId && conversationId) {
          await generateConversationTitle(enhancedMessage, fullContent, conversationId, onTitleGenerated)
        }
        
        // Detect search tag and trigger Tavily flow
        try {
          let searchMatch = fullContent.match(/<(SEARCHREQUEST|SEARCH_REQUEST|SEARCH|WEBSEARCH|WEB_SEARCH)>([\s\S]*?)<\/\1>/i)
          if (!searchMatch) {
            const upper = fullContent.toUpperCase()
            const candidates = ['SEARCHREQUEST','SEARCH_REQUEST','SEARCH','WEBSEARCH','WEB_SEARCH']
            for (const tag of candidates) {
              const openToken = `<${tag}>`
              const closeToken = `</${tag}>`
              const openIdx = upper.indexOf(openToken)
              const closeIdx = upper.indexOf(closeToken)
              if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
                const inner = fullContent.substring(openIdx + openToken.length, closeIdx)
                searchMatch = [fullContent.substring(openIdx, closeIdx + closeToken.length), tag, inner] as unknown as RegExpMatchArray
                break
              }
            }
          }

          if (searchMatch) {
            const regex = /<(SEARCHREQUEST|SEARCH_REQUEST|SEARCH|WEBSEARCH|WEB_SEARCH)>([\s\S]*?)<\/\1>/gi
            const queries: string[] = []
            let m: RegExpExecArray | null
            while ((m = regex.exec(fullContent)) !== null) {
              queries.push(m[2].trim())
            }
            const queuedQueries = queries.length > 0 ? queries : [searchMatch[2].trim()]
            console.log('[Orphion] Modular: detected search tags:', queuedQueries)

            // Initialize multiSearch list on the message (persist too)
            const initialMultiSearch = queuedQueries.map(q => ({ query: q, completed: false }))
            setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, multiSearch: initialMultiSearch } : msg))
            try {
              if (conversationId) {
                updateMessageInConversation(conversationId, aiMessage.id, { multiSearch: initialMultiSearch } as any)
              }
            } catch {}

            // Aggregate results across all searches
            const aggregatedAnswers: string[] = []
            const aggregatedSources: Array<{ title: string; url: string; content: string; score: number; published_date?: string | null }> = []
            const aggregatedImages: Array<{ url: string; title?: string; alt?: string }> = []

            // Process queries sequentially
            for (let i = 0; i < queuedQueries.length; i++) {
              const q = queuedQueries[i]
              try {
                const results = await orphionAIService.searchWeb(q)
                // Mark completed with results in multiSearch[i]
                {
                  // Update UI
                  let updatedMs: any[] = []
                setLocalMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessage.id) return msg
                  const ms = Array.isArray((msg as any).multiSearch) ? ([...(msg as any).multiSearch] as any[]) : []
                  if (ms[i]) {
                    ms[i] = {
                      ...ms[i],
                      completed: true,
                      results: {
                      answer: results.answer,
                      sources: results.sources,
                      images: results.images,
                        query: results.query,
                      }
                    }
                  }
                    updatedMs = ms
                  return { ...msg, multiSearch: ms }
                }))
                  // Persist
                  try {
                    if (conversationId) {
                      updateMessageInConversation(conversationId, aiMessage.id, { multiSearch: updatedMs } as any)
                    }
                  } catch {}
                }

                // Collect aggregates
                if (results?.answer) aggregatedAnswers.push(`Step ${i + 1}:\n${results.answer}`)
                if (Array.isArray(results?.sources)) aggregatedSources.push(...results.sources)
                if (Array.isArray(results?.images)) aggregatedImages.push(...results.images)
              } catch (tErr) {
                console.error('[Orphion] Modular: Tavily search failed for step', i + 1, tErr)
                {
                  let updatedMs: any[] = []
                setLocalMessages(prev => prev.map(msg => {
                  if (msg.id !== aiMessage.id) return msg
                  const ms = Array.isArray((msg as any).multiSearch) ? ([...(msg as any).multiSearch] as any[]) : []
                  if (ms[i]) ms[i] = { ...ms[i], completed: true, error: true }
                    updatedMs = ms
                  return { ...msg, multiSearch: ms }
                }))
                  try {
                    if (conversationId) {
                      updateMessageInConversation(conversationId, aiMessage.id, { multiSearch: updatedMs } as any)
                    }
                  } catch {}
                }
              }
            }

            // After all searches: single final synthesis (and optional viz)
            try {
              const wantsViz = /\b(plot|graph|chart|visuali[sz]e|bar chart|line chart|scatter)\b/i.test(userMessage.content)
                const history = [...localMessages, userMessage].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }))

              const combinedAnswer = aggregatedAnswers.join('\n\n')
              const hiddenContext = {
                query: queuedQueries.join(' | '),
                answer: combinedAnswer,
                sources: aggregatedSources,
                images: aggregatedImages,
              }

              if (wantsViz) {
                // Trigger code execution first so pill + image render, then add summary message
                setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, codeExecuting: true } : msg))
                let execAccumulatedCode: any | undefined = undefined
                await orphionAIService.streamMessage(
                  'Using the hidden search context, generate the requested visualization using Python matplotlib. Produce executable Python code and run it with the code execution tool to return a single PNG image. Do not restate the context.',
                  history,
                  (chunk: any) => {
                    if (chunk.executableCode) {
                      execAccumulatedCode = chunk.executableCode
                    }
                    setLocalMessages(prev => prev.map(m => {
                      if (m.id !== aiMessage.id) return m
                      return {
                        ...m,
                        executableCode: execAccumulatedCode || (m as any).executableCode,
                        generatedImages: Array.isArray(chunk.generatedImages) ? chunk.generatedImages : (m as any).generatedImages,
                        codeExecuting: !!execAccumulatedCode && !Array.isArray(chunk.generatedImages),
                        codeExecuted: Array.isArray(chunk.generatedImages) ? true : (m as any).codeExecuted,
                      }
                    }))
                  },
                  'gemini-2.5-flash',
                  hiddenContext
                )
                // Ensure flags finalized
                setLocalMessages(prev => prev.map(m => m.id === aiMessage.id ? { ...m, codeExecuting: false, codeExecuted: true } : m))
              }

              // Single final text answer
              setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, isFinalizing: true } : msg))
              const final = await orphionAIService.sendMessageWithContext(
                'Using the hidden search context (multiple steps), synthesize a concise final answer that integrates all findings. Do not expose the context.',
                history,
                undefined,
                hiddenContext
              )
              setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, isFinalizing: false } : msg))
                const finalMessage = {
                  id: generateUniqueId('ai'),
                  content: final.content,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }
              setLocalMessages(prev => [...prev, finalMessage])
                try {
                  if (conversationId) {
                    await addMessageToConversation(conversationId, finalMessage)
                  }
                } catch {}

              // After multi-search synthesis, detect <IMG> and generate images
              try {
                const imgMatch = final.content.match(/<IMG>([\s\S]*?)<\/IMG>/i)
                if (imgMatch) {
                  const prompt = imgMatch[1].trim()
                  setLocalMessages(prev => prev.map(m => m.id === finalMessage.id ? { ...m, imagePrompt: prompt, imageGenerationCompleted: false } : m))
                  try {
                    const gen = await orphionAIService.generateImage(prompt)
                    setLocalMessages(prev => prev.map(m => m.id === finalMessage.id ? { ...m, imageGenerationCompleted: true, generatedImages: gen.images } : m))
                    // Persist generated images along with flags so they appear after reload
                    try {
                      if (conversationId) {
                        updateMessageInConversation(conversationId, finalMessage.id, { imageGenerationCompleted: true, imagePrompt: prompt, generatedImages: gen.images } as any)
                      }
                    } catch {}
                  } catch (imgErr) {
                    console.error('[Orphion] Modular: post-final image generation failed:', imgErr)
                    setLocalMessages(prev => prev.map(m => m.id === finalMessage.id ? { ...m, imageGenerationCompleted: true, imageGenerationError: true } : m))
                  }
                }
              } catch (imgDetectErr) {
                console.error('[Orphion] Modular: final image detection error:', imgDetectErr)
              }
              } catch (finalErr) {
              console.error('[Orphion] Modular: multi-search finalization failed:', finalErr)
            }
          }
        } catch (detectErr) {
          console.error('[Orphion] Modular: search detection error:', detectErr)
        }

        // Detect image generation tag and trigger Gemini image route
        try {
          const imgRegex = /<IMG>([\s\S]*?)<\/IMG>/i
          const imgMatch = fullContent.match(imgRegex)
          if (imgMatch) {
            const prompt = imgMatch[1].trim()
            setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, imagePrompt: prompt, imageGenerationCompleted: false } : msg))
            try {
              const result = await orphionAIService.generateImage(prompt)
              setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, imageGenerationCompleted: true, generatedImages: result.images } : msg))
              // Persist generated images along with flags for reload persistence
              if (conversationId) {
                try {
                  updateMessageInConversation(conversationId, aiMessage.id, { imageGenerationCompleted: true, imagePrompt: prompt, generatedImages: result.images } as any)
                } catch {}
              }
            } catch (imgErr) {
              console.error('[Orphion] Modular: image generation failed:', imgErr)
              setLocalMessages(prev => prev.map(msg => msg.id === aiMessage.id ? { ...msg, imageGenerationCompleted: true, imageGenerationError: true } : msg))
            }
          }
        } catch (imgDetectErr) {
          console.error('[Orphion] Modular: image tag detection error:', imgDetectErr)
        }

        // Set loading to false after successful streaming
        setIsLoading(false)
        
      } catch (streamError) {
        console.error('Streaming error:', streamError)

        // Try fallback to non-streaming response
        try {
          console.log('Trying fallback to non-streaming...')
          const response = await orphionAIService.sendMessage(enhancedMessage)
          console.log('Fallback response:', response)
          const updatedMessages = messagesWithAI.map(msg =>
            msg.id === aiMessage.id ? { ...msg, content: response.content } : msg
          )
          handleLocalMessagesUpdate(updatedMessages)

          // Save fallback AI message to conversation storage
          if (conversationId) {
            const fallbackAIMessage = { ...aiMessage, content: response.content }
            await addMessageToConversation(conversationId, fallbackAIMessage)
          }

          // Set loading to false after fallback response
          setIsLoading(false)

        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError)

          // Provide a helpful fallback response based on the error
          const fallbackContent = createFallbackContent(fallbackError)

          const updatedMessages = messagesWithAI.map(msg =>
            msg.id === aiMessage.id ? { ...msg, content: fallbackContent } : msg
          )
          handleLocalMessagesUpdate(updatedMessages)

          // Save fallback error message to conversation storage
          if (conversationId) {
            const fallbackErrorMessage = { ...aiMessage, content: fallbackContent }
            await addMessageToConversation(conversationId, fallbackErrorMessage)
          }

          // Set loading to false after fallback error
          setIsLoading(false)
        }
      }

    } catch (error) {
      console.error('Message handling error:', error)

      // Add error message with helpful information
      const errorContent = createErrorContent(error)

      const errorMessage = {
        id: generateUniqueId('ai'),
        content: errorContent,
        sender: 'ai' as const,
        timestamp: new Date()
      }
      const messagesWithError = [...newMessages, errorMessage]
      handleLocalMessagesUpdate(messagesWithError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file: FileAttachment) => {
    setAttachedFile(file)
  }

  const handleRemoveFile = () => {
    setAttachedFile(null)
  }

  const handleToolSelect = (tool: ToolType) => {
    setSelectedTool(tool)
  }

  const handleRemoveTool = () => {
    setSelectedTool(null)
  }

  const handleVoiceInput = (transcript: string) => {
    setMessage(transcript)
  }

  const handleLikeMessage = (messageId: string) => {
    console.log('Like message:', messageId)
  }

  const handleDislikeMessage = (messageId: string) => {
    console.log('Dislike message:', messageId)
  }

  const handleRegenerateMessage = (messageId: string) => {
    console.log('Regenerate message:', messageId)
  }

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt)
  }

  const handleModeChange = (mode: 'auto' | 'agent' | 'chat') => {
    console.log('Mode changed to:', mode)
  }

  // Handle page creation and navigation
  const handlePageCreated = (pageId: string, pageTitle: string, pageContent: string) => {
    // Navigate to the page
    handlePageNavigation(pageId)

    // Call the parent callback if provided
    if (onPageCreated) {
      onPageCreated(pageId, pageTitle, pageContent)
    }
  }

  return (
    <>
      {/* Hover area to auto-close sidebar when sidebar is open (only when not docked) */}
      <SidebarOverlay
        sidebarOpen={sidebarOpen}
        sidebarDocked={sidebarDocked}
        closeTimeout={closeTimeout}
        onCloseSidebar={onCloseSidebar}
        onSetCloseTimeout={onSetCloseTimeout}
      />

      {/* Main Content */}
      <div className="flex-1 h-full">
        {localMessages.length === 0 ? (
          <MessageBoxUI
            key={chatKey}
            messages={localMessages}
            message={message}
            isLoading={isLoading}
            attachedFile={attachedFile}
            selectedTool={selectedTool}
            sidebarOpen={sidebarOpen}
            isAnalyzingImage={false}
            isProcessingDocument={false}
            conversationTitle={conversationTitle}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onTextareaChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            onToolSelect={(tool) => {
              handleToolSelect(tool)
            }}
            onRemoveTool={handleRemoveTool}
            onVoiceInput={handleVoiceInput}
            onLikeMessage={handleLikeMessage}
            onDislikeMessage={handleDislikeMessage}
            onRegenerateMessage={handleRegenerateMessage}
            onPageCreated={handlePageCreated}
            onPromptClick={handlePromptClick}
            getPlaceholderText={() => getPlaceholderText(selectedTool)}
            textareaRef={textareaRef}
            scrollableRef={scrollableRef}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <ConversationUI
            key={chatKey}
            messages={localMessages}
            message={message}
            isLoading={isLoading}
            attachedFile={attachedFile}
            selectedTool={selectedTool}
            sidebarOpen={sidebarOpen}
            isAnalyzingImage={false}
            isProcessingDocument={false}
            conversationTitle={conversationTitle}
            isFavorite={isFavorite}
            showHeader={true}
            showScrollButton={true}
            showGeneratingIndicator={false}
            showEmptyChat={false}
            showTools={true}
            onToggleFavorite={onToggleFavorite}
            onNewChat={onNewChat}
            onTextareaChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            onToolSelect={(tool) => {
              handleToolSelect(tool)
            }}
            onRemoveTool={handleRemoveTool}
            onVoiceInput={handleVoiceInput}
            onLikeMessage={handleLikeMessage}
            onDislikeMessage={handleDislikeMessage}
            onRegenerateMessage={handleRegenerateMessage}
            onPageCreated={handlePageCreated}
            onPromptClick={handlePromptClick}
            onModeChange={handleModeChange}
            getPlaceholderText={() => getPlaceholderText(selectedTool)}

          />
        )}
      </div>

      {/* Settings Popup Component */}
      <SettingsPopup
        isOpen={showSettings}
        onClose={onCloseSettings}
      />
    </>
  )
}
