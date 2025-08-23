"use client"

import React from "react"
import { ChatMessage } from '@/lib/chat-storage'
import MessageBubble from '../message-bubble/MessageBubble'
import ChatGPTStyleScrolling from './ChatGPTStyleScrolling'



interface ChatInterfaceProps {
  // State props
  message: string
  messages: ChatMessage[]
  isLoading: boolean

  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null
  selectedTool: 'study' | null
  sidebarOpen: boolean
  hasConversation: boolean
  isAnalyzingImage: boolean
  isProcessingDocument: boolean
  conversationTitle?: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
  
  // Event handlers
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onFileUpload: (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => void
  onRemoveFile: () => void
  onToolSelect: (tool: 'study' | null) => void
  onRemoveTool: () => void
  onVoiceInput: (transcript: string) => void
  onLikeMessage: (messageId: string) => void
  onDislikeMessage: (messageId: string) => void
  onRegenerateMessage: (messageId: string) => void

  onPromptClick: (prompt: string) => void
  onModeChange?: (mode: 'auto' | 'agent' | 'chat') => void
  
  // Utility functions
  getPlaceholderText: (isConversationState?: boolean) => string
}

export default function ChatInterface({
  // State props
  message,
  messages,
  isLoading,

  attachedFile,
  selectedTool,
  sidebarOpen,
  hasConversation,
  isAnalyzingImage,
  isProcessingDocument,
  conversationTitle = "New Chat",
  isFavorite = false,
  onToggleFavorite,
  
  // Event handlers
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

  onPromptClick,
  onModeChange,
  
  // Utility functions
  getPlaceholderText
}: ChatInterfaceProps) {

  return (
    <div className="flex flex-col flex-1 h-full min-h-0" style={{ backgroundColor: '#f5f7f6' }}>
      {/* Initial State - Only show when no conversation */}
      <>
        {!hasConversation && (
          <div 
            className="flex-1 flex flex-col items-center justify-center p-8"
            style={{ backgroundColor: '#f5f7f6' }}
          >
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Orphion AI
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Your Gen-Z AI assistant powered by TEJ Intelligence. 
                Ask me anything, upload files, or start a conversation!
              </p>
              
              {/* Example Prompts */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Try these examples:
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => onPromptClick("What's the latest news about AI?")}
                    className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="font-medium text-gray-900 mb-1">Latest AI News</div>
                    <div className="text-sm text-gray-600">Get the latest updates on AI technology</div>
                  </button>
                  
                  <button
                    onClick={() => onPromptClick("Help me write a professional email")}
                    className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="font-medium text-gray-900 mb-1">Email Writing</div>
                    <div className="text-sm text-gray-600">Get help with professional communication</div>
                  </button>
                  
                  <button
                    onClick={() => onPromptClick("Explain quantum computing in simple terms")}
                    className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="font-medium text-gray-900 mb-1">Learning</div>
                    <div className="text-sm text-gray-600">Understand complex topics easily</div>
                  </button>
                  
                  <button
                    onClick={() => onPromptClick("Create a workout plan for beginners")}
                    className="p-4 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="font-medium text-gray-900 mb-1">Health & Fitness</div>
                    <div className="text-sm text-gray-600">Get personalized health advice</div>
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                💡 Tip: You can also upload images, documents, or use voice input for a more interactive experience.
              </div>
            </div>
          </div>
        )}
      </>

      {/* Chat Interface - Show when conversation exists */}
      <>
        {hasConversation && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#f5f7f6' }}>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {conversationTitle}
                </h2>
                {isFavorite && (
                  <span className="text-yellow-500">⭐</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {onToggleFavorite && (
                  <button
                    onClick={onToggleFavorite}
                    className={`p-2 rounded-md transition-colors ${
                      isFavorite 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    ⭐
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <ChatGPTStyleScrolling messages={messages} isLoading={isLoading}>
              {messages.map((msg) => (
                <div key={msg.id} className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    {/* Message Bubble Component */}
                    <MessageBubble 
                      message={msg}
                      onLikeMessage={onLikeMessage}
                      onDislikeMessage={onDislikeMessage}
                      onRegenerateMessage={onRegenerateMessage}
                    />
                  </div>
                </div>
              ))}
              

            </ChatGPTStyleScrolling>

            {/* Input Area */}
                            <div className="p-4" style={{ backgroundColor: '#f5f7f6' }}>
                  <div className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mx-auto`}>
                    {/* Message Input Component will be imported here */}
                {/* <MessageInput 
                  ref={textareaRef}
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
                  onModeChange={onModeChange}
                /> */}
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  )
} 