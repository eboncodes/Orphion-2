"use client"

import React, { useState, useEffect, useMemo } from "react"
import MessageBubble from "../message-bubble/MessageBubble"
import MessageInput from "../message/MessageInput"
import ExamplePrompts from "../ui/ExamplePrompts"
import EmptyChat from "../../pages/EmptyChat"
import AuthHeader from "../../auth/AuthHeader"
import ConversationInfo from "./ConversationInfo"

import ChatGPTStyleScrolling from "./ChatGPTStyleScrolling"

interface ConversationUIProps {
  messages: any[]
  message: string
  isLoading: boolean
  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null
  selectedTool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | null
  sidebarOpen: boolean
  isAnalyzingImage: boolean
  isProcessingDocument: boolean
  conversationTitle: string
  isFavorite: boolean
  showHeader?: boolean
  showScrollButton?: boolean
  showGeneratingIndicator?: boolean
  showEmptyChat?: boolean
  showTools?: boolean
  showFileAttachment?: boolean
  onToggleFavorite: () => void
  onNewChat: () => void
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onFileUpload: (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => void
  onRemoveFile: () => void
  onToolSelect: (tool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | null) => void
  onRemoveTool: () => void
  onVoiceInput: (transcript: string) => void
  onLikeMessage: (messageId: string) => void
  onDislikeMessage: (messageId: string) => void
  onRegenerateMessage: (messageId: string) => void
  onPageCreated?: (pageId: string, pageTitle: string, pageContent: string) => void
  onPromptClick: (prompt: string) => void
  onModeChange?: (mode: 'auto' | 'agent' | 'chat') => void
  getPlaceholderText: () => string
  onImageSuggestion?: () => void
}

export default function ConversationUI({
  messages,
  message,
  isLoading,
  attachedFile,
  selectedTool,
  sidebarOpen,
  isAnalyzingImage,
  isProcessingDocument,
  conversationTitle,
  isFavorite,
  showHeader = true,
  showScrollButton = true,
  showGeneratingIndicator = true,
  showEmptyChat = false,
  showTools = true,
  showFileAttachment = true,
  onToggleFavorite,
  onTextareaChange,
  onKeyDown,
  onSendMessage,
  onFileUpload,
  onRemoveFile,
  onToolSelect,
  onRemoveTool,
  onVoiceInput,
  onLikeMessage,
  onDislikeMessage,
  onRegenerateMessage,
  onPageCreated,
  onPromptClick,
  onModeChange,
  getPlaceholderText,
  onNewChat,
  onImageSuggestion
}: ConversationUIProps) {
  const [animateIn, setAnimateIn] = useState(false)
  const [showConversationInfo, setShowConversationInfo] = useState(false)

  useEffect(() => {
    // Trigger entrance animation on mount
    const id = requestAnimationFrame(() => setAnimateIn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Process messages with useMemo at component level to avoid hooks order issues
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>()
    const unique = [] as any[]
    for (const m of messages) {
      if (m && typeof m.id === 'string') {
        if (seen.has(m.id)) continue
        seen.add(m.id)
      }
      unique.push(m)
    }
    return unique
  }, [messages])

  return (
    <div className="flex h-full min-h-0" style={{ backgroundColor: '#f5f7f6' }}>
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Conversation Header */}
        {showHeader && (
          <div className="sticky top-0 z-10 px-4 py-3" style={{ backgroundColor: '#f5f7f6' }}>
            <div className={`transition-all duration-500 ease-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'} max-w-4xl mx-auto flex items-center justify-between ${
              sidebarOpen ? "max-w-2xl" : "max-w-3xl"
            }`}>
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-normal text-gray-900 truncate">
                  {conversationTitle}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                
                <div className="relative group">
                  <button 
                    onClick={onNewChat}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                    New task
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>


                
                <div className="relative group">
                  <button
                    onClick={() => setShowConversationInfo(!showConversationInfo)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Conversation info
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>
                </div>
                {/* Auth Header */}
                <AuthHeader showNotifications={false} />
              </div>
            </div>
          </div>
        )}

        {/* Conversation Info Component */}
        <ConversationInfo
          isOpen={showConversationInfo}
          onClose={() => setShowConversationInfo(false)}
          messages={messages}
        />

        {/* Conversation Messages */}
        {messages.length === 0 && showEmptyChat ? (
          <EmptyChat />
        ) : (
          <ChatGPTStyleScrolling messages={messages} isLoading={isLoading} showScrollButton={showScrollButton} disableScrollButton={false}>
            {uniqueMessages.map((message, index) => (
              <div key={`${message.id}-${index}`} id={`message-${message.id}`}>
                <MessageBubble 
                  message={message} 
                  isLoading={isLoading && message.sender === 'ai' && index === messages.length - 1}
                  onLikeMessage={onLikeMessage}
                  onDislikeMessage={onDislikeMessage}
                  onRegenerateMessage={onRegenerateMessage}
                  onPageCreated={onPageCreated}
                  onImageSuggestion={onImageSuggestion}
                />
              </div>
            ))}
          </ChatGPTStyleScrolling>
        )}

        {/* Fixed Input Box */}
        <div className="p-4" style={{ backgroundColor: '#f5f7f6' }}>
          <div className={`transition-all duration-500 ease-out ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mx-auto`}>
            <MessageInput
              value={message}
              onChange={onTextareaChange}
              onKeyDown={onKeyDown}
              onSend={onSendMessage}
              placeholder={getPlaceholderText()}
              attachedFile={attachedFile}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              isLoading={isLoading}
              sidebarOpen={sidebarOpen}
              isAnalyzingImage={isAnalyzingImage}
              isProcessingDocument={isProcessingDocument}
              onVoiceInput={onVoiceInput}
              selectedTool={selectedTool}
              onRemoveTool={onRemoveTool}
              onToolSelect={onToolSelect}
              showTools={showTools}
              showFileAttachment={showFileAttachment}
              messages={messages}
              showGeneratingIndicator={showGeneratingIndicator}
            />

            {/* Example Prompts */}
            <ExamplePrompts 
              selectedTool={selectedTool}
              onPromptClick={onPromptClick}
              messageValue={message}
              messages={messages}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 