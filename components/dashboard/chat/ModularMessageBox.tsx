"use client"

import React, { useState, useRef, useEffect } from "react"
import 'katex/dist/katex.min.css'
import MessageBoxUI from '../message/MessageBoxUI'

import { useTTS } from '@/hooks/useTTS'
import { useFileAnalysis } from '@/hooks/useFileAnalysis'
import { useWebSearch } from '@/hooks/useWebSearch'

import { ChatMessage } from '@/lib/chat-storage'
import { 
  useConversationManager,
  useMessageHandlers,
  useMessageSender,
  useInputHandlers
} from './hooks'

type Message = ChatMessage

interface ModularMessageBoxProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onMessagesUpdate: (messages: Message[]) => void
  onMessageUpdate: (messageId: string, newContent: string) => void
  currentConversationId?: string | null
  conversationTitle?: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onConversationCreated?: (conversationId: string) => void
  onTitleGenerated?: (title: string) => void
  onPageCreated?: (pageId: string, pageTitle: string, pageContent: string) => void
}

export default function ModularMessageBox({
  sidebarOpen,
  onToggleSidebar,
  onMessagesUpdate,
  onMessageUpdate,
  currentConversationId: propCurrentConversationId,
  conversationTitle = "New Chat",
  isFavorite = false,
  onToggleFavorite,
  onConversationCreated,
  onTitleGenerated,
  onPageCreated
}: ModularMessageBoxProps) {
  // Local state
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [attachedFile, setAttachedFile] = useState<{ file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null>(null)
  const [selectedTool, setSelectedTool] = useState<'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null>(null)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollableRef = useRef<HTMLDivElement>(null)

  // Custom hooks
  const { handleVoiceMessage, stopTTS } = useTTS()
  const { isAnalyzingImage, isProcessingDocument } = useFileAnalysis()
  const { searchWeb } = useWebSearch()

  // Conversation management
  const {
    messages,
    currentConversationId,
    isNewChatMode,
    saveMessageToStorage,
    updateMessageInStorage,
    createNewConversation,
    addMessage,
    updateMessage,
    removeMessagesAfter
  } = useConversationManager({
    propCurrentConversationId,
    onMessagesUpdate,
    onConversationCreated
  })

  // Message sender
  const { 
    sendMessageInternal,
    processFunctionCalls
  } = useMessageSender({
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
    onTitleGenerated: onTitleGenerated || (() => {})
  })

  // Message handlers
  const {
    handleLikeMessage,
    handleDislikeMessage,
    handleRegenerateMessage
  } = useMessageHandlers({
    messages,
    updateMessage,
    updateMessageInStorage,
    onMessagesUpdate,
    sendMessageInternal,
    removeMessagesAfter
  })

  // Input handlers
  const {
    handleTextareaChange,
    handleKeyDown,
    handleSendMessage,
    handleFileUpload,
    removeAttachedFile,
    handleToolSelect,
    handleRemoveTool,
    handleVoiceInput,
    handlePromptClick,
    getPlaceholderText
  } = useInputHandlers({
    message,
    attachedFile,
    selectedTool,
    setMessage,
    setAttachedFile,
    setSelectedTool,
    sendMessageInternal,
    textareaRef
  })



  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle page creation and navigation
  const handlePageCreated = (pageId: string, pageTitle: string, pageContent: string) => {
    // Navigate to the page with canvas content and auto-send flag
    if (typeof window !== 'undefined') {
      // Encode the page content for URL
      const encodedContent = encodeURIComponent(pageContent)
      window.location.href = `/pages?page=${pageId}&canvas=${encodedContent}&send=true`
    }
    
    // Call the parent callback if provided
    if (onPageCreated) {
      onPageCreated(pageId, pageTitle, pageContent)
    }
  }



  return (
    <MessageBoxUI
      // State props
      message={message}
      messages={messages}
      isLoading={isLoading}
      
      attachedFile={attachedFile}
      selectedTool={selectedTool}
      sidebarOpen={sidebarOpen}
      isAnalyzingImage={isAnalyzingImage}
      isProcessingDocument={isProcessingDocument}

      conversationTitle={conversationTitle}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite || (() => {})}
      
      // Refs
      textareaRef={textareaRef}
      scrollableRef={scrollableRef}
      messagesEndRef={messagesEndRef}
      
      // Event handlers
      onTextareaChange={handleTextareaChange}
      onKeyDown={handleKeyDown}
      onSendMessage={handleSendMessage}
      onFileUpload={handleFileUpload}
      onRemoveFile={removeAttachedFile}
      onToolSelect={handleToolSelect}
      onRemoveTool={handleRemoveTool}
      onVoiceInput={handleVoiceInput}
      onLikeMessage={handleLikeMessage}
      onDislikeMessage={handleDislikeMessage}
      onRegenerateMessage={handleRegenerateMessage}
      onPageCreated={handlePageCreated}
      
      onPromptClick={handlePromptClick}
      
      // Utility functions
      getPlaceholderText={getPlaceholderText}
    />
  )
} 