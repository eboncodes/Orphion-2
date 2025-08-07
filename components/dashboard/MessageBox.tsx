"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

import { orphionAIService } from "@/app/services/OrphionAIService"
import 'katex/dist/katex.min.css'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ModelSelector, { ModelType } from './ModelSelector'

import { useTTS } from '@/hooks/useTTS'
import { useFileAnalysis } from '@/hooks/useFileAnalysis'
import { useWebSearch } from '@/hooks/useWebSearch'
import { useImageGeneration } from '@/hooks/useImageGeneration'

import { 
  ChatMessage, 
  ChatConversation, 
  createConversation, 
  getConversation, 
  updateConversation, 
  addMessageToConversation, 
  updateMessageInConversation,
  getMostRecentConversation,
  hasSavedConversations,
  cleanupStorage
} from '@/lib/chat-storage'
import { getAPIKeys } from '@/lib/api-keys'

// Use ChatMessage from chat-storage instead of local Message interface
type Message = ChatMessage

interface MessageBoxProps {
  sidebarOpen: boolean
  hasConversation: boolean
  onStartConversation: () => void
  onToggleSidebar?: () => void
  onCanvasToggle?: (isOpen: boolean, messageId?: string) => void
  onMessagesUpdate?: (messages: Message[]) => void
  onMessageUpdate?: (messageId: string, newContent: string) => void // Add callback for message updates
  currentConversationId?: string | null
}

export default function MessageBox({ 
  sidebarOpen, 
  hasConversation, 
  onStartConversation, 
  onToggleSidebar, 
  onCanvasToggle, 
  onMessagesUpdate,
  onMessageUpdate,
  currentConversationId: propCurrentConversationId
}: MessageBoxProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [attachedFile, setAttachedFile] = useState<{ file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null>(null)
  const [selectedTool, setSelectedTool] = useState<'web-search' | 'study' | 'canvas' | 'image-generation' | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-2.5-flash')
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isNewChatMode, setIsNewChatMode] = useState(false)


  // Helper function to save messages to localStorage
  const saveMessageToStorage = async (message: Message) => {
    if (currentConversationId) {
      await addMessageToConversation(currentConversationId, message)
      // Clean up storage if needed
      cleanupStorage()
    }
  }

  // Helper function to update messages in localStorage
  const updateMessageInStorage = (messageId: string, updates: Partial<Message>) => {
    if (currentConversationId) {
      updateMessageInConversation(currentConversationId, messageId, updates)
    }
  }

  // Map model selector values to actual API model names
  const getModelName = (modelType: ModelType): string => {
    switch (modelType) {
      case 'gemini-2.5-flash':
        return 'gemini-2.5-flash'
      case 'gemini-2.5-flash-lite':
        return 'gemini-2.5-flash-lite'
      default:
        return 'gemini-2.5-flash'
    }
  }

  // Custom hooks
  const { handleVoiceMessage, stopTTS } = useTTS()
  const { isAnalyzingImage, isProcessingDocument, analyzeFile } = useFileAnalysis()
  const { searchWeb, shouldUseSearch } = useWebSearch()
  const { generateImage, isGenerating } = useImageGeneration()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)

  // Load conversation from props or most recent conversation on mount
  useEffect(() => {
    console.log('MessageBox: propCurrentConversationId changed to:', propCurrentConversationId)
    
    if (propCurrentConversationId) {
      // Load conversation from props (when user clicks on sidebar)
      const conversation = getConversation(propCurrentConversationId)
      if (conversation) {
        console.log('MessageBox: Loading conversation:', conversation.id)
        setMessages(conversation.messages)
        setCurrentConversationId(conversation.id)
        setIsNewChatMode(false)
        if (conversation.messages.length > 0) {
          onStartConversation()
        }
      }
    } else if (propCurrentConversationId === null) {
      // Explicitly clear conversation state when propCurrentConversationId is null
      console.log('MessageBox: Clearing conversation state for new chat')
      setMessages([])
      setCurrentConversationId(null)
      setIsNewChatMode(true)
    } else if (propCurrentConversationId === undefined && hasSavedConversations() && messages.length === 0 && !isNewChatMode) {
      // Only load most recent conversation on initial mount, not when explicitly setting to null
      const mostRecent = getMostRecentConversation()
      if (mostRecent) {
        console.log('MessageBox: Loading most recent conversation:', mostRecent.id)
        setMessages(mostRecent.messages)
        setCurrentConversationId(mostRecent.id)
        if (mostRecent.messages.length > 0) {
          onStartConversation()
        }
      }
    }
  }, [propCurrentConversationId])

  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Pass the message update callback to parent
  useEffect(() => {
    if (onMessageUpdate) {
      // Store the callback in a way that parent can access it
      // We'll use a ref to store the callback
      const messageUpdateRef = { current: handleCanvasMessageUpdate }
      // Pass the ref to parent (this is a bit hacky but works)
      ;(window as any).__messageUpdateCallback = messageUpdateRef
    }
  }, [onMessageUpdate])

  // Stop TTS when a new message is sent
  useEffect(() => {
    if (isLoading) {
      stopTTS()
    }
  }, [isLoading, stopTTS])

  // Smooth scroll function optimized for streaming
  const scrollToBottom = useCallback(() => {
    if (scrollableRef.current) {
      const scrollElement = scrollableRef.current;
      const targetScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
      
      const currentScrollTop = scrollElement.scrollTop;
      const distance = targetScrollTop - currentScrollTop;
      
      if (Math.abs(distance) > 1) {
        scrollElement.scrollTop = currentScrollTop + (distance * 0.3);
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollableRef.current) {
      scrollableRef.current.scrollTo({ top: scrollableRef.current.scrollHeight, behavior: 'smooth' });
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [messages]);

  // Update parent component with messages and save to localStorage
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages)
    }
    
    // Save messages to localStorage if we have a current conversation
    if (currentConversationId && messages.length > 0) {
      updateConversation(currentConversationId, { messages })
    }
  }, [messages, onMessagesUpdate, currentConversationId])

  // Auto-scroll during streaming updates with throttling
  useEffect(() => {
    if (isLoading || isStreaming) {
      scrollToBottom();
    }
  }, [isLoading, isStreaming]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (message.trim()) {
        sendMessageInternal()
      }
    }
  }

  const handleSendMessage = () => {
    sendMessageInternal()
  }

  const handleFileUpload = (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => {
    setAttachedFile(file)
  }

  const removeAttachedFile = () => {
    setAttachedFile(null)
  }

  const handleToolSelect = (tool: 'web-search' | 'study' | 'canvas' | 'image-generation' | null) => {
    setSelectedTool(tool)
  }

  const handleRemoveTool = () => {
    setSelectedTool(null)
  }

  const handleVoiceInput = (transcript: string) => {
    setMessage(prev => prev + transcript)
  }

  // Message interaction handlers
  const handleLikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isLiked: !msg.isLiked, isDisliked: false }
        : msg
    ))
    
    // Save like/dislike to localStorage
    if (currentConversationId) {
      const message = messages.find(msg => msg.id === messageId)
      if (message) {
        updateMessageInConversation(currentConversationId, messageId, {
          isLiked: !message.isLiked,
          isDisliked: false
        })
      }
    }
  }

  const handleDislikeMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isDisliked: !msg.isDisliked, isLiked: false }
        : msg
    ))
    
    // Save like/dislike to localStorage
    if (currentConversationId) {
      const message = messages.find(msg => msg.id === messageId)
      if (message) {
        updateMessageInConversation(currentConversationId, messageId, {
          isDisliked: !message.isDisliked,
          isLiked: false
        })
      }
    }
  }

  const handleRegenerateMessage = async (messageId: string) => {
    // Find the user message that preceded this AI message
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex <= 0) return

    const userMessage = messages[messageIndex - 1]
    if (userMessage.sender !== 'user') return

    // Remove the current AI message
    setMessages(prev => prev.filter(msg => msg.id !== messageId))

    // Regenerate the response
    setIsLoading(true)
    const startTime = Date.now()

    try {
      // Get conversation history up to the user message (excluding the AI message we're regenerating)
      const conversationHistory = messages.slice(0, messageIndex - 1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // Create a new streaming AI message
      const newAiMessageId = (Date.now() + 1).toString()
      const newAiMessage: Message = {
        id: newAiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
        responseTime: 0,
        usedWebSearch: false
      }
      
      // Add the empty AI message to start streaming
      setMessages(prev => [...prev, newAiMessage])
      setIsStreaming(true)

      let fullContent = ''
      let lastUpdateTime = 0
      let updateTimeout: NodeJS.Timeout | null = null
      
      // Use streaming method with optimized character-by-character rendering
      await orphionAIService.streamMessage(userMessage.content, (chunk: string) => {
        fullContent += chunk
        
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdateTime
        
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout)
        }
        
        // Throttle updates to 60fps for smooth animation
        if (timeSinceLastUpdate >= 16) { // ~60fps
          setMessages(prev => prev.map(msg => 
            msg.id === newAiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ))
          
          // Update message in localStorage
          if (currentConversationId) {
            updateMessageInConversation(currentConversationId, newAiMessageId, { content: fullContent })
          }
          
          lastUpdateTime = now
          
          // Smooth scroll to bottom during streaming
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        } else {
          // Schedule update for next frame
          updateTimeout = setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === newAiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            ))
            
            // Update message in localStorage
            if (currentConversationId) {
              updateMessageInConversation(currentConversationId, newAiMessageId, { content: fullContent })
            }
            
            lastUpdateTime = Date.now()
            
            // Smooth scroll to bottom during streaming
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }, 16 - timeSinceLastUpdate)
        }
      }, conversationHistory, getModelName(selectedModel))
      
      // Ensure final content is updated
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      setMessages(prev => prev.map(msg => 
        msg.id === newAiMessageId 
          ? { ...msg, content: fullContent }
          : msg
      ))
      
      // Update final content in localStorage
      if (currentConversationId) {
        updateMessageInConversation(currentConversationId, newAiMessageId, { content: fullContent })
      }
      
      setIsStreaming(false)
      
      const responseTime = Math.round((Date.now() - startTime) / 1000)
      
      // Update the final message with response time
      setMessages(prev => prev.map(msg => 
        msg.id === newAiMessageId 
          ? { ...msg, responseTime: responseTime }
          : msg
      ))
      
      // Update message in localStorage
      if (currentConversationId) {
        updateMessageInConversation(currentConversationId, newAiMessageId, { responseTime })
      }
      
      setIsLoading(false)
      
      // Focus the textarea after regenerating
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0)
    } catch (error) {
      console.error('Error regenerating message:', error)
      setIsLoading(false)
      setIsStreaming(false)
      
      // Add error message to the conversation
      const errorResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: `❌ Failed to regenerate message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'ai',
        timestamp: new Date(),
        responseTime: 0
      }
      
      setMessages(prev => [...prev, errorResponse])
    }
  }

  // Get placeholder text based on selected tool and conversation state
  const getPlaceholderText = (isConversationState = false) => {
    if (isConversationState) {
      return "Ask a follow-up question..."
    }
    if (selectedTool === 'web-search') {
      return "Search the web for anything..."
    }
    if (selectedTool === 'study') {
      return "Enter a topic to study or learn about..."
    }
    if (selectedTool === 'canvas') {
      return "Describe a topic for detailed documentary creation..."
    }
    if (selectedTool === 'image-generation') {
      return "Describe the image you want to generate..."
    }
    return "Assign a task or ask anything"
  }

  const sendMessageInternal = async () => {
    if ((!message.trim() && !attachedFile) || isLoading) return

    // Create new conversation if this is the first message or if no current conversation
    let conversationId = currentConversationId
    if (messages.length === 0 || !currentConversationId) {
      console.log('Creating new conversation...')
      const newConversation = createConversation('New Chat', getModelName(selectedModel))
      console.log('New conversation created:', newConversation.id)
      conversationId = newConversation.id
      setCurrentConversationId(newConversation.id)
      onStartConversation()
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      attachedFile: attachedFile ? {
        file: attachedFile.file,
        preview: attachedFile.preview,
        type: attachedFile.type
      } : undefined
    }

    setMessages(prev => [...prev, userMessage])
    
    // Save user message to localStorage
    await saveMessageToStorage(userMessage)
    
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
          const aiMessageId = (Date.now() + 1).toString()
          const aiMessage: Message = {
            id: aiMessageId,
            content: analysisResponse,
            sender: 'ai',
            timestamp: new Date(),
            responseTime: Math.round((Date.now() - startTime) / 1000),
            usedWebSearch: false
          }
          
          setMessages(prev => [...prev, aiMessage])
          
          // Save AI message to localStorage
          await saveMessageToStorage(aiMessage)
          
          setIsLoading(false)
          
          // Focus the textarea after sending a message
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 0)
          
          return
        } catch (error) {
          console.error('File analysis error:', error)
          
          // Add error message to the conversation
          const errorResponse: Message = {
            id: (Date.now() + 2).toString(),
            content: `❌ File analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sender: 'ai',
            timestamp: new Date(),
            responseTime: 0
          }
          
          setMessages(prev => [...prev, errorResponse])
          
          // Save error message to localStorage
          await saveMessageToStorage(errorResponse)
          
          setIsLoading(false)
          return
        }
      }

      // Handle image generation if selected
      if (selectedTool === 'image-generation') {
        try {
          // Convert messages to conversation history format
          const conversationHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
          
          // First, send to DeepSeek to get an improved prompt
          const enhancedMessage = `[IMAGE GENERATION MODE] I want to generate an image. Please help me create a professional, detailed prompt for image generation based on my request. 

IMPORTANT: You must respond with the enhanced prompt wrapped in <IMAGEPROMPT> tags like this: <IMAGEPROMPT>your enhanced prompt here</IMAGEPROMPT>

Make the prompt highly detailed with specific visual elements, lighting, composition, style, and artistic direction. Include details like:
- Visual style (photorealistic, artistic, cinematic, etc.)
- Lighting (natural, dramatic, soft, etc.)
- Composition (close-up, wide shot, etc.)
- Color palette and mood
- Specific details and elements
- Quality descriptors (high quality, detailed, crisp, etc.)

The enhanced prompt should be suitable for AI image generation while keeping the same context and meaning as the original request.

Original request: ${currentMessage}

Please provide the enhanced prompt in the <IMAGEPROMPT> tags.`
          
          // Create a streaming AI message for DeepSeek response
          const aiMessageId = (Date.now() + 1).toString()
          const aiMessage: Message = {
            id: aiMessageId,
            content: '',
            sender: 'ai',
            timestamp: new Date(),
            responseTime: 0,
            usedWebSearch: false,
            isGeneratingImage: true // Flag to show skeleton
          }
          
          setMessages(prev => [...prev, aiMessage])
          setIsStreaming(true)

      let fullContent = ''
      let lastUpdateTime = 0
      let updateTimeout: NodeJS.Timeout | null = null
      
      // Use streaming method with optimized character-by-character rendering
      await orphionAIService.streamMessage(enhancedMessage, (chunk: string) => {
        fullContent += chunk
        
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdateTime
        
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout)
        }
        
        // Check for code block start during streaming
        const codeBlockStartMatch = fullContent.match(/```(\w+)?\n?$/)
        if (codeBlockStartMatch && !fullContent.includes('```', fullContent.lastIndexOf('```') + 3)) {
          // Code block just started, trigger code editor
          console.log('Code block detected during streaming:', codeBlockStartMatch[1] || 'text')
          // You can add logic here to open code editor immediately
        }
        
        // Throttle updates to 60fps for smooth animation
        if (timeSinceLastUpdate >= 16) { // ~60fps
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ))
          
          // Update message in localStorage
          if (currentConversationId) {
            updateMessageInConversation(currentConversationId, aiMessageId, { content: fullContent })
          }
          
          lastUpdateTime = now
          
          // Smooth scroll to bottom during streaming
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        } else {
          // Schedule update for next frame
          updateTimeout = setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            ))
            
            // Update message in localStorage
            if (currentConversationId) {
              updateMessageInConversation(currentConversationId, aiMessageId, { content: fullContent })
            }
            
            lastUpdateTime = Date.now()
            
            // Smooth scroll to bottom during streaming
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }, 16 - timeSinceLastUpdate)
        }
      }, conversationHistory, getModelName(selectedModel))
      
      // Ensure final content is updated
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: fullContent }
          : msg
      ))
      
      // Update final content in localStorage
      if (currentConversationId) {
        updateMessageInConversation(currentConversationId, aiMessageId, { content: fullContent })
      }
          
          setIsStreaming(false)
          
          // Extract the improved prompt from DeepSeek response with better regex
          const imagePromptMatch = fullContent.match(/<IMAGEPROMPT>([\s\S]*?)<\/IMAGEPROMPT>/i)
          const improvedPrompt = imagePromptMatch ? imagePromptMatch[1].trim() : currentMessage
          
          console.log('Original prompt:', currentMessage)
          console.log('Full AI response:', fullContent)
          console.log('Image prompt match:', imagePromptMatch)
          console.log('Improved prompt:', improvedPrompt)
          
          // Show the improved prompt while generating
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: `🎨 **Generating Image...**\n\n**Enhanced Prompt:** ${improvedPrompt}` }
              : msg
          ))
          
          // Now generate the image with the improved prompt
          const imageResult = await generateImage(improvedPrompt)
          
          if (imageResult.success && imageResult.image) {
            // Update the message with just the simple response and image
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: "Here's your generated image:",
                    generatedImage: imageResult.image,
                    isGeneratingImage: false,
                    responseTime: Math.round((Date.now() - startTime) / 1000)
                  }
                : msg
            ))
          } else {
            // Handle image generation error - don't show "Here's your generated image"
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { 
                    ...msg, 
                    content: `❌ Image generation failed. ${imageResult.error || 'Please try again.'}`,
                    isGeneratingImage: false,
                    responseTime: Math.round((Date.now() - startTime) / 1000)
                  }
                : msg
            ))
          }
          
          setIsLoading(false)
          
          // Generate conversation title if conditions are met (for image generation)
          const updatedMessages = [...messages, { ...userMessage }, { id: aiMessageId, content: "Here's your generated image:", sender: 'ai' as const, timestamp: new Date() }]
          console.log('Checking title generation for image generation:', updatedMessages.length)
          if (shouldGenerateTitle(updatedMessages) && currentConversationId) {
            console.log('Title generation conditions met for image generation...')
            try {
              const title = await generateConversationTitle(updatedMessages)
              if (title) {
                updateConversation(currentConversationId, { title })
                console.log('Generated conversation title:', title)
              }
            } catch (error) {
              console.error('Error generating title:', error)
            }
          } else {
            console.log('Title generation conditions not met for image generation')
          }
          
          // Reset the selected tool after using it to prevent auto-opening on subsequent messages
          setSelectedTool(null)
          
          // Focus the textarea after sending a message
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 0)
          
          return
        } catch (error) {
          console.error('Image generation error:', error)
          
          // Add error message to the conversation
          const errorResponse: Message = {
            id: (Date.now() + 2).toString(),
            content: `❌ Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sender: 'ai',
            timestamp: new Date(),
            responseTime: 0
          }
          
          setMessages(prev => [...prev, errorResponse])
          setIsLoading(false)
          return
        }
      }

      // Convert messages to conversation history format
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      // Add teacher mode instruction if Study & Learn is selected
      let enhancedMessage = currentMessage
      if (selectedTool === 'study') {
        enhancedMessage = `[TEACHER MODE] Act as a knowledgeable teacher and explain this topic in detail using simple, easy-to-understand language. Break down complex concepts and provide comprehensive information: ${currentMessage}`
      }
      
      // Add canvas mode instruction if Canvas is selected
      if (selectedTool === 'canvas') {
        enhancedMessage = `[CANVAS MODE] Create a highly detailed documentary-style content about this topic. Focus only on the most important and essential information. Write in a comprehensive, well-structured manner suitable for a detailed documentary. Include key facts, important details, and comprehensive coverage. Keep the content focused and substantial: ${currentMessage}`
      }

      // Handle web search if selected or auto-detected
      let useSearch = selectedTool === 'web-search'
      let searchResults: { answer: string; sources: Array<{ title: string; url: string; content: string; score: number; published_date?: string | null }>; query: string } | undefined = undefined
      
      // Auto-detect if search is needed
      if (!useSearch && !selectedTool) {
        useSearch = shouldUseSearch(currentMessage)
      }

      // Remove the keyword detection code - AI will handle image generation through function calling

      if (useSearch) {
        try {
          searchResults = await searchWeb(currentMessage)
          console.log('🔍 Search results received:', searchResults)
        } catch (error) {
          console.error('Search failed:', error)
          // Continue without search if it fails
        }
      }

      // Create a streaming AI message
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
        responseTime: 0,
        usedWebSearch: useSearch,
        searchResults: searchResults ? {
          answer: searchResults.answer,
          sources: searchResults.sources,
          query: searchResults.query
        } : undefined
      }
      
                // Add the empty AI message to start streaming
          setMessages(prev => [...prev, aiMessage])
          
          // Save initial AI message to localStorage
          if (currentConversationId) {
            addMessageToConversation(currentConversationId, aiMessage)
          }
          
          setIsStreaming(true)

      let fullContent = ''
      let lastUpdateTime = 0
      let updateTimeout: NodeJS.Timeout | null = null
      
      // Use streaming method with optimized character-by-character rendering
      await orphionAIService.streamMessage(enhancedMessage, (chunk: string) => {
        fullContent += chunk
        
        const now = Date.now()
        const timeSinceLastUpdate = now - lastUpdateTime
        
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout)
        }
        
        // Throttle updates to 60fps for smooth animation
        if (timeSinceLastUpdate >= 16) { // ~60fps
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: fullContent }
              : msg
          ))
          
          // Update message in localStorage
          if (currentConversationId) {
            updateMessageInConversation(currentConversationId, aiMessageId, { content: fullContent })
          }
          
          lastUpdateTime = now
          
          // Smooth scroll to bottom during streaming
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        } else {
          // Schedule update for next frame
          updateTimeout = setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: fullContent }
                : msg
            ))
            
            // Update message in localStorage
            if (currentConversationId) {
              updateMessageInConversation(currentConversationId, aiMessageId, { content: fullContent })
            }
            
            lastUpdateTime = Date.now()
            
            // Smooth scroll to bottom during streaming
            requestAnimationFrame(() => {
              scrollToBottom();
            });
          }, 16 - timeSinceLastUpdate)
        }
      }, conversationHistory, getModelName(selectedModel))
      
      // Ensure final content is updated
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: fullContent }
          : msg
      ))
      
      // Update final content in localStorage
      if (currentConversationId) {
        updateMessageInConversation(currentConversationId, aiMessageId, { content: fullContent })
      }
      
      setIsStreaming(false)
      
      // Check for function calls in the final content
      const hasFunctionCall = await processFunctionCalls(fullContent, aiMessageId)
      
      const responseTime = Math.round((Date.now() - startTime) / 1000)
      
      // Update the final message with response time (only if no function call was processed)
      if (!hasFunctionCall) {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, responseTime: responseTime }
            : msg
        ))
        
        // Update message in localStorage
        if (currentConversationId) {
          updateMessageInConversation(currentConversationId, aiMessageId, { responseTime })
        }
      }
      
      setIsLoading(false)
      
      // Generate conversation title if conditions are met
      const updatedMessages = [...messages, { ...userMessage }, { id: aiMessageId, content: fullContent, sender: 'ai' as const, timestamp: new Date() }]
      console.log('Checking title generation for updated messages:', updatedMessages.length)
      if (shouldGenerateTitle(updatedMessages) && currentConversationId) {
        console.log('Title generation conditions met, generating title...')
        try {
          const title = await generateConversationTitle(updatedMessages)
          if (title) {
            updateConversation(currentConversationId, { title })
            console.log('Generated conversation title:', title)
          }
        } catch (error) {
          console.error('Error generating title:', error)
        }
      } else {
        console.log('Title generation conditions not met or no conversation ID')
      }
      
      // Auto-open canvas if canvas mode was selected for this specific message
      if (selectedTool === 'canvas' && onCanvasToggle) {
        // Wait a bit for the message to be fully rendered
        setTimeout(() => {
          onCanvasToggle(true, aiMessageId)
        }, 500)
        // Reset the selected tool after using it to prevent auto-opening on subsequent messages
        setSelectedTool(null)
      }
      
      // Reset the selected tool after using it to prevent auto-opening on subsequent messages
      if (selectedTool) {
        setSelectedTool(null)
      }
      
      // Focus the textarea after sending a message
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0)
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Handle other errors with user-friendly messages
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Add error message to the conversation
        const errorResponse: Message = {
          id: (Date.now() + 2).toString(),
          content: `❌ ${errorMessage}`,
          sender: 'ai',
          timestamp: new Date(),
          responseTime: 0
        };
        
        setMessages(prev => [...prev, errorResponse]);
        
        // Save error message to localStorage
        if (currentConversationId) {
          addMessageToConversation(currentConversationId, errorResponse)
        }
      }
      
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  // Function to handle image generation (can be called by AI)
  const handleImageGeneration = async (prompt: string, aiMessageId: string) => {
    try {
      // Convert messages to conversation history format
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
      
      // First, send to DeepSeek to get an improved prompt
      const enhancedMessage = `[IMAGE GENERATION MODE] I want to generate an image. Please help me create a professional, detailed prompt for image generation based on my request. 

IMPORTANT: You must respond with the enhanced prompt wrapped in <IMAGEPROMPT> tags like this: <IMAGEPROMPT>your enhanced prompt here</IMAGEPROMPT>

Make the prompt highly detailed with specific visual elements, lighting, composition, style, and artistic direction. Include details like:
- Visual style (photorealistic, artistic, cinematic, etc.)
- Lighting (natural, dramatic, soft, etc.)
- Composition (close-up, wide shot, etc.)
- Color palette and mood
- Specific details and elements
- Quality descriptors (high quality, detailed, crisp, etc.)

The enhanced prompt should be suitable for AI image generation while keeping the same context and meaning as the original request.

Original request: ${prompt}

Please provide the enhanced prompt in the <IMAGEPROMPT> tags.`
      
      // Update the AI message to show it's generating
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isGeneratingImage: true }
          : msg
      ))

      let fullContent = ''
      
      // Use streaming method to get DeepSeek response
      await orphionAIService.streamMessage(enhancedMessage, (chunk: string) => {
        fullContent += chunk
        
        // Update the AI message with the new content
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: fullContent }
            : msg
        ))
        
        // Smooth scroll to bottom during streaming
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }, conversationHistory, getModelName(selectedModel))
      
      // Extract the improved prompt from DeepSeek response with better regex
      const imagePromptMatch = fullContent.match(/<IMAGEPROMPT>([\s\S]*?)<\/IMAGEPROMPT>/i)
      const improvedPrompt = imagePromptMatch ? imagePromptMatch[1].trim() : prompt
      
      console.log('Original prompt:', prompt)
      console.log('Full AI response:', fullContent)
      console.log('Image prompt match:', imagePromptMatch)
      console.log('Improved prompt:', improvedPrompt)
      
      // Show the improved prompt while generating
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: `🎨 **Generating Image...**\n\n**Enhanced Prompt:** ${improvedPrompt}` }
          : msg
      ))
      
      // Now generate the image with the improved prompt
      const imageResult = await generateImage(improvedPrompt)
      
      if (imageResult.success && imageResult.image) {
        // Update the message with just the simple response and image
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: "Here's your generated image:",
                generatedImage: imageResult.image,
                isGeneratingImage: false
              }
            : msg
        ))
      } else {
        // Handle image generation error - don't show "Here's your generated image"
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: `❌ Image generation failed. ${imageResult.error || 'Please try again.'}`,
                isGeneratingImage: false
              }
            : msg
        ))
      }
    } catch (error) {
      console.error('Image generation error:', error)
      
      // Handle image generation error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: "❌ Image generation failed. Please try again.",
              isGeneratingImage: false
            }
          : msg
      ))
    }
  }

  // Function to detect and handle function calls in AI responses
  const processFunctionCalls = async (content: string, aiMessageId: string) => {
    // Check for image generation function call (only correct format)
    const imageCallMatch = content.match(/<FUNCTION_CALL>generate_image\(([^)]+)\)<\/FUNCTION_CALL>/i)
    
    if (imageCallMatch) {
      const prompt = imageCallMatch[1].trim()
      console.log('AI requested image generation:', prompt)
      
      // Call the image generation function
      await handleImageGeneration(prompt, aiMessageId)
      return true
    }
    
    return false
  }

  // Function to generate conversation title
  const generateConversationTitle = async (messages: Message[]) => {
    console.log('Attempting to generate title for messages:', messages.length)
    try {
      const apiKeys = getAPIKeys()
      const response = await fetch('/api/gemini/generate-chat-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': apiKeys.gemini
        },
        body: JSON.stringify({ messages }),
      })

      console.log('Title generation response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Generated title:', data.title)
        return data.title
      } else {
        const errorData = await response.json()
        console.error('Title generation failed:', errorData)
      }
    } catch (error) {
      console.error('Error generating conversation title:', error)
    }
    return null
  }

  // Function to check if we should generate a title
  const shouldGenerateTitle = (messages: Message[]) => {
    const userMessages = messages.filter(msg => msg.sender === 'user')
    const aiMessages = messages.filter(msg => msg.sender === 'ai')
    const shouldGenerate = userMessages.length >= 2 && aiMessages.length >= 2
    console.log('Title generation check:', {
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      shouldGenerate
    })
    return shouldGenerate
  }

  // Handle Canvas message updates
  const handleCanvasMessageUpdate = (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        // Check if the original message had thinking content
        const hasThinkingContent = msg.content.includes('<think>')
        
        if (hasThinkingContent) {
          // Extract thinking content from original message
          const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
          let thinkingContent = ''
          let match
          
          // Extract all thinking content from original
          while ((match = thinkRegex.exec(msg.content)) !== null) {
            if (match[1]) {
              thinkingContent += match[1].trim() + '\n\n'
            }
          }
          
          // Combine the new content with the original thinking content
          const finalContent = thinkingContent.trim() 
            ? `<think>${thinkingContent.trim()}</think>\n\n${newContent}`
            : newContent
          
          return { ...msg, content: finalContent }
        } else {
          // No thinking content, just update with new content
          return { ...msg, content: newContent }
        }
      }
      return msg
    }))
    
    // Save updated message to localStorage
    if (currentConversationId) {
      const message = messages.find(msg => msg.id === messageId)
      if (message) {
        const hasThinkingContent = message.content.includes('<think>')
        let finalContent = newContent
        
        if (hasThinkingContent) {
          const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
          let thinkingContent = ''
          let match
          
          while ((match = thinkRegex.exec(message.content)) !== null) {
            if (match[1]) {
              thinkingContent += match[1].trim() + '\n\n'
            }
          }
          
          finalContent = thinkingContent.trim() 
            ? `<think>${thinkingContent.trim()}</think>\n\n${newContent}`
            : newContent
        }
        
        updateMessageInConversation(currentConversationId, messageId, { content: finalContent })
      }
    }
  }

  // Canvas handlers
  const handleOpenCanvas = (messageId: string) => {
    onCanvasToggle?.(true, messageId)
  }

  const handleCloseCanvas = () => {
    onCanvasToggle?.(false)
  }



  return (
    <div className="flex flex-col flex-1 h-full min-h-0" style={{ backgroundColor: '#f5f7f6' }}>
      {/* Initial State - Only show when no conversation */}
      <>
        {!hasConversation && (
          <div 
            key="initial-state"
            className="flex-1 flex flex-col items-center justify-center px-8"
          >

            {/* Greeting Text */}
            <div className={`w-full mb-6 ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"}`}>
              <h1 className="font-radely text-3xl font-normal text-gray-900 mb-1 text-left">
                Hello Hisham Sardar Ebon
              </h1>
              <p className="font-radely text-3xl text-gray-600 text-left">
                What can I do for you?
              </p>
            </div>

            {/* Input Box */}
            <div 
              className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"}`}
            >
              <MessageInput
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onSend={handleSendMessage}
                placeholder={getPlaceholderText()}
                attachedFile={attachedFile}
                onFileUpload={handleFileUpload}
                onRemoveFile={removeAttachedFile}
                isLoading={isLoading}
                sidebarOpen={sidebarOpen}
                isAnalyzingImage={isAnalyzingImage}
                isProcessingDocument={isProcessingDocument}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onVoiceInput={handleVoiceInput}
              />
            </div>

            {/* Tools Section - Smaller and Greyish */}
            <div className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mt-4 flex justify-center`}>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleToolSelect('image-generation')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedTool === 'image-generation' ? 'bg-gray-100 border-gray-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Image</span>
                </button>

                <button
                  onClick={() => handleToolSelect('canvas')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedTool === 'canvas' ? 'bg-gray-100 border-gray-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3z"/>
                      <path d="M8 7h8"/>
                      <path d="M8 11h8"/>
                      <path d="M8 15h6"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Canvas</span>
                </button>

                <button
                  onClick={() => handleToolSelect('web-search')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    selectedTool === 'web-search' ? 'bg-gray-100 border-gray-400' : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Web Search</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-200 bg-gray-50"
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M9 3v18"/>
                      <path d="M3 9h18"/>
                      <path d="M3 15h18"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Spreadsheet</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-200 bg-gray-50"
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M9 17V9"/>
                      <path d="M15 17V9"/>
                      <path d="M3 12h18"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Visualization</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-200 bg-gray-50"
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                      <polygon points="9,6 15,12 9,18"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Video</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-200 bg-gray-50"
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h2l2-8 2 8h2"/>
                      <path d="M9 12h2l2-8 2 8h2"/>
                      <path d="M15 12h2l2-8 2 8h2"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Audio</span>
                </button>

                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-200 bg-gray-50"
                >
                  <div className="w-4 h-4 text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <path d="M8 12h8"/>
                      <path d="M12 8v8"/>
                      <path d="M3 12h18"/>
                      <path d="M15 8l4 4-4 4"/>
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-600">Playbook</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Conversation Messages */}
      <>
        {hasConversation && messages.length > 0 && (
          <div 
            key="conversation-state"
            ref={scrollableRef} 
            className="flex-1 min-h-0 overflow-y-auto relative scrollbar-hide"
          >

            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={message.id} id={`message-${message.id}`}>
                    <MessageBubble 
                      message={message} 
                      isCurrentlyStreaming={isStreaming && index === messages.length - 1}
                      isLoading={isLoading && message.sender === 'ai' && index === messages.length - 1}
                      onCanvasToggle={onCanvasToggle}
                      onLikeMessage={handleLikeMessage}
                      onDislikeMessage={handleDislikeMessage}
                      onRegenerateMessage={handleRegenerateMessage}
                    />
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}
      </>



      {/* Fixed Input Box - Show when conversation has started */}
      <>
        {hasConversation && (
          <div 
            key="fixed-input"
            className="p-4"
          >
            <div className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mx-auto`}>
              <MessageInput
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                onSend={handleSendMessage}
                placeholder={getPlaceholderText(true)}
                attachedFile={attachedFile}
                onFileUpload={handleFileUpload}
                onRemoveFile={removeAttachedFile}
                isLoading={isLoading}
                sidebarOpen={sidebarOpen}
                isAnalyzingImage={isAnalyzingImage}
                isProcessingDocument={isProcessingDocument}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onVoiceInput={handleVoiceInput}
              />
            </div>
          </div>
        )}
      </>


    </div>
  )
}