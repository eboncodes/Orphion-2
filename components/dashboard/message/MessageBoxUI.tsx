"use client"

import React from "react"
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ExamplePrompts from '../ui/ExamplePrompts'
import { useAuth } from '@/contexts/AuthContext'
import { Feather } from 'lucide-react'


// Use ChatMessage from chat-storage instead of local Message interface
type Message = any // We'll import the proper type

interface MessageBoxUIProps {
  messages: any[]
  message: string
  isLoading: boolean
  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null
  selectedTool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null
  sidebarOpen: boolean
  isAnalyzingImage: boolean
  isProcessingDocument: boolean
  conversationTitle: string
  isFavorite: boolean
  onToggleFavorite: () => void
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onFileUpload: (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => void
  onRemoveFile: () => void
  onToolSelect: (tool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null) => void
  onRemoveTool: () => void
  onVoiceInput: (transcript: string) => void
  onLikeMessage: (messageId: string) => void
  onDislikeMessage: (messageId: string) => void
  onRegenerateMessage: (messageId: string) => void
  onPageCreated?: (pageId: string, pageTitle: string, pageContent: string) => void
  onPromptClick: (prompt: string) => void
  getPlaceholderText: () => string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  scrollableRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export default function MessageBoxUI({
  // State props
  message,
  messages,
  isLoading,
  attachedFile,
  selectedTool,
  sidebarOpen,
  isAnalyzingImage,
  isProcessingDocument,
  conversationTitle = "New Chat",
  isFavorite = false,
  onToggleFavorite,
  
  // Refs
  textareaRef,
  scrollableRef,
  messagesEndRef,
  
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
  onPageCreated,
  
  onPromptClick,
  
  // Utility functions
  getPlaceholderText
}: MessageBoxUIProps) {
  const { user } = useAuth()

  return (
    <div className="flex flex-col flex-1 h-full min-h-0" style={{ backgroundColor: '#f5f7f6' }}>
      {/* Always show the initial state */}
      <div 
        key="initial-state"
        className="flex-1 flex flex-col items-center justify-center px-8"
      >
        {/* Greeting Text */}
        <div className={`w-full mb-6 ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} flex justify-center`}>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-b from-black via-gray-700 to-gray-500 bg-clip-text text-transparent">
            Hello, {user?.name || 'there'}
          </h1>
        </div>

        {/* Input Box */}
        <div
          className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} relative`}
        >
          <MessageInput
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
            onToolSelect={onToolSelect}

            messages={messages}
          />

          {/* Example Prompts */}
          <ExamplePrompts
            selectedTool={selectedTool}
            onPromptClick={onPromptClick}
            messageValue={message}
            messages={messages}
          />
        </div>

        {/* Tools Section - Only show when no tool is selected */}
        {!selectedTool && (
          <div className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mt-4 flex justify-center`}>
            <div className="flex flex-wrap gap-2 justify-center">




              <button
                onClick={() => onToolSelect('study')}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700"
              >
                <Feather className="w-4 h-4" />
                <span className="text-xs font-medium">Study</span>
              </button>

              <button
                onClick={() => onToolSelect('image')}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700"
              >
                <div className="w-4 h-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
                <span className="text-xs font-medium">Image</span>
              </button>

              <button
                onClick={() => onToolSelect('pages')}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700"
              >
                <div className="w-4 h-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                <span className="text-xs font-medium">Pages</span>
              </button>

              <button
                onClick={() => onToolSelect('table')}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700"
              >
                <div className="w-4 h-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <span className="text-xs font-medium">Table</span>
              </button>

              <button
                onClick={() => onToolSelect('webpage')}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 bg-white hover:bg-blue-50 hover:border-blue-200 border border-gray-200 text-gray-700 hover:text-blue-700"
              >
                <div className="w-4 h-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <span className="text-xs font-medium">Webpage</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Show messages below the input when they exist */}
      {messages.length > 0 && (
        <div className="mt-8 px-4">
          <div className={`w-full ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mx-auto`}>
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={message.id} id={`message-${message.id}`}>
                  <MessageBubble 
                    message={message} 
                    isLoading={isLoading && message.sender === 'ai' && index === messages.length - 1}
                    onLikeMessage={onLikeMessage}
                    onDislikeMessage={onDislikeMessage}
                    onRegenerateMessage={onRegenerateMessage}
                    onPageCreated={onPageCreated}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 