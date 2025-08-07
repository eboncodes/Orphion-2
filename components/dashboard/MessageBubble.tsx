"use client"

import React, { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Copy, ThumbsUp, ThumbsDown, Volume2, Wand2, Share2, RotateCcw, ChevronDown, Check } from "lucide-react"
import Image from "next/image"
import { renderFormattedContent } from './KaTeXRenderer'
import { renderContentWithCodeBlocks } from './CodeBlockDetector'
import StreamingCodeRenderer from './StreamingCodeRenderer'
import SearchSources from './SearchSources'
import { Pulse } from '@/components/ui/pulse'
import { containsBengali, getFontClass } from '@/lib/bengali-utils'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  responseTime?: number
  usedWebSearch?: boolean
  searchResults?: {
    answer: string
    sources: Array<{
      title: string
      url: string
      content: string
      score: number
      published_date?: string | null
    }>
    query: string
  }
  attachedFile?: {
    file: File
    preview: string
    type: 'image' | 'document' | 'pdf' | 'excel' | 'csv'
    description?: string
  }
  isLiked?: boolean
  isDisliked?: boolean
  isPlayingTTS?: boolean
  generatedImage?: string
  isGeneratingImage?: boolean
}

interface MessageBubbleProps {
  message: Message
  isCurrentlyStreaming: boolean
  isLoading?: boolean
  onCanvasToggle?: (isOpen: boolean, messageId?: string) => void
  onLikeMessage?: (messageId: string) => void
  onDislikeMessage?: (messageId: string) => void
  onRegenerateMessage?: (messageId: string) => void
}

export default function MessageBubble({ 
  message, 
  isCurrentlyStreaming, 
  isLoading = false,
  onCanvasToggle,
  onLikeMessage,
  onDislikeMessage,
  onRegenerateMessage
}: MessageBubbleProps) {
  const [isThinkingOpen, setIsThinkingOpen] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [currentTTSMessageId, setCurrentTTSMessageId] = useState<string | null>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false)
  const [isImagePopupClosing, setIsImagePopupClosing] = useState(false)
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis)
    }
  })

  // Robust function to extract thinking content and clean display content
  const extractThinkingContent = (content: string) => {
    if (message.sender !== 'ai') return { thinkingContent: null, displayContent: content }
    
    try {
      // More robust regex to handle multiple think tags and edge cases
      const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
      let thinkingContent = ''
      let displayContent = content
      let match
      
      // Extract all thinking content
      while ((match = thinkRegex.exec(content)) !== null) {
        if (match[1]) {
          thinkingContent += match[1].trim() + '\n\n'
        }
      }
      
      // Remove all think tags from display content
      displayContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      
      // Additional cleanup for any remaining malformed tags
      displayContent = displayContent
        .replace(/<think>/gi, '') // Remove opening tags without closing
        .replace(/<\/think>/gi, '') // Remove closing tags without opening
        .trim()
      
      // Clean up thinking content
      thinkingContent = thinkingContent.trim()
      
      // Additional safety check: if display content is empty after removing think tags, 
      // but we have thinking content, provide a fallback
      if (!displayContent && thinkingContent) {
        displayContent = "I've analyzed this and here's my reasoning..."
      }
      
      return { thinkingContent, displayContent }
    } catch (error) {
      console.error('Error extracting thinking content:', error)
      return { thinkingContent: null, displayContent: content }
    }
  }

  // Function to detect if content contains code blocks
  const hasCodeBlocks = (content: string): boolean => {
    return content.includes('```')
  }

  // Function to detect if content contains tables
  const hasTables = (content: string): boolean => {
    // For now, allow canvas editing for all tables since we've improved table handling
    // This function can be used for future enhancements if needed
    return false
  }

  const { thinkingContent, displayContent } = extractThinkingContent(message.content)

  // Simple check: show UI if message is complete (not currently streaming)
  const showUI = message.sender === 'ai' && message.content.length > 0 && !isCurrentlyStreaming

  // Button functionality handlers
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      
      // Show check mark for 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleLikeMessage = (messageId: string) => {
    onLikeMessage?.(messageId)
  }

  const handleDislikeMessage = (messageId: string) => {
    onDislikeMessage?.(messageId)
  }

  const handleVoiceMessage = (messageId: string, content: string) => {
    if (!speechSynthesis) return

    // Stop any currently playing TTS
    if (currentUtterance) {
      speechSynthesis.cancel()
    }

    // If clicking the same message that's playing, stop it
    if (currentTTSMessageId === messageId) {
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
      return
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    // Set up event handlers
    utterance.onstart = () => {
      setCurrentTTSMessageId(messageId)
      setCurrentUtterance(utterance)
    }

    utterance.onend = () => {
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
    }

    utterance.onerror = () => {
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
    }

    // Start speaking
    speechSynthesis.speak(utterance)
  }

  const handleRegenerateMessage = (messageId: string) => {
    onRegenerateMessage?.(messageId)
  }

  const handleOpenCanvas = (messageId: string) => {
    onCanvasToggle?.(true, messageId)
  }

  return (
    <>
      <div 
        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          ease: "easeOut",
          type: "spring",
          stiffness: 80,
          damping: 20
        }}
      >
        {/* AI Avatar for AI messages */}
        {message.sender === 'ai' && (
          <div className="flex-shrink-0 mt-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <div
                animate={(isLoading || isCurrentlyStreaming) ? { rotate: 360 } : { rotate: 0 }}
                transition={{
                  duration: 2,
                  repeat: (isLoading || isCurrentlyStreaming) ? Infinity : 0,
                  ease: "linear"
                }}
                className="w-6 h-6"
              >
                <Image 
                  src="/ophion-icon-black.png"
                  alt="Orphion AI"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
          </div>
        )}
        
        <div 
          className={`${message.sender === 'user' ? 'max-w-[80%]' : 'max-w-[80%]'}`}
          initial={{ opacity: 0, y: -15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut",
            delay: 0.15
          }}
        >

        
        {/* Thinking Process Display */}
        <React.Fragment>
          {message.sender === 'ai' && thinkingContent && thinkingContent.length > 0 && !isCurrentlyStreaming && (
            <div 
              className={`mb-0 transition-all duration-300 ease-out ${
            showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
            <div className="text-gray-700">
              <button 
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="text-base cursor-pointer hover:text-gray-900 mb-0 flex items-center pl-4"
              >
                <ChevronDown 
                  className={`w-4 h-4 mr-2 transition-transform duration-300 ease-in-out ${
                    isThinkingOpen ? 'rotate-180' : ''
                  }`} 
                />
                Reasoned for {message.responseTime || 1} seconds
              </button>
                <React.Fragment>
                  {isThinkingOpen && (
                    <div 
                      className="border-l-2 border-gray-300 pl-3 py-2 text-sm text-gray-700"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
              >
                <div className={`whitespace-pre-wrap text-sm max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${getFontClass(thinkingContent)}`}>
                  {renderFormattedContent(thinkingContent, message.sender)}
                </div>
                    </div>
                  )}
                </React.Fragment>
              </div>
            </div>
        )}
        </React.Fragment>
        
        {/* Message Content - Different styling for user vs AI */}
        {message.sender === 'user' ? (
          <div className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-900">
            {/* Display attached file if present for user messages */}
            {message.attachedFile && (
              <div className="mb-3">
                <div className="relative inline-block">
                  {message.attachedFile.type === 'image' ? (
                    <img
                      src={message.attachedFile.preview}
                      alt="Attached image"
                      className="max-w-[200px] max-h-[150px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsImagePopupOpen(true)}
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-3 bg-transparent rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {message.attachedFile.type === 'pdf' ? 'PDF' : 
                           message.attachedFile.type === 'document' ? 'DOC' :
                           message.attachedFile.type === 'excel' ? 'XLS' : 'CSV'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.attachedFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {message.attachedFile.type.toUpperCase()} file
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className={`text-base leading-relaxed ${getFontClass(displayContent)}`}>
              {displayContent && (
                <>
                  {containsBengali(displayContent) && (
                    <div className="text-xs text-blue-500 mb-1">🔤 Bengali font applied</div>
                  )}
                  {renderFormattedContent(
                    displayContent
                      .replace(/<think>[\s\S]*?<\/think>/gi, '')
                      .replace(/<think>/gi, '')
                      .replace(/<\/think>/gi, '')
                      .trim(), 
                    message.sender
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl px-4 py-3 bg-transparent text-gray-900"
        >
          {/* Display attached file if present */}
          {message.attachedFile && (
            <div className="mb-3">
              <div className="relative inline-block">
                {message.attachedFile.type === 'image' ? (
                  <img
                    src={message.attachedFile.preview}
                    alt="Attached image"
                    className="max-w-xs max-h-48 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-100 border border-blue-200 shadow-sm flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📄</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className={`text-base leading-relaxed transition-opacity duration-150 ${
            isCurrentlyStreaming ? 'opacity-90' : 'opacity-100'
          } ${getFontClass(displayContent)}`}>
            {displayContent && (
              <div className="streaming-content">
                {isCurrentlyStreaming ? (
                  <StreamingCodeRenderer
                    content={displayContent
                      .replace(/<think>[\s\S]*?<\/think>/gi, '')
                      .replace(/<think>/gi, '')
                      .replace(/<\/think>/gi, '')
                      .trim()}
                    sender={message.sender}
                    isStreaming={true}
                  />
                ) : (
                  renderFormattedContent(
                    displayContent
                      .replace(/<think>[\s\S]*?<\/think>/gi, '')
                      .replace(/<think>/gi, '')
                      .replace(/<\/think>/gi, '')
                      .trim(), 
                    message.sender
                  )
                )}
              </div>
            )}
          </div>
          
          {/* Image Generation Skeleton */}
          {message.isGeneratingImage && (
            <div className="mt-4">
              <div className="bg-transparent rounded-2xl border border-gray-200 shadow-sm p-4 w-80">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">🎨</span>
                  </div>
                  <div className="flex-1">
                    <Pulse>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </Pulse>
                    <Pulse>
                      <div className="h-3 bg-gray-200 rounded w-24 mt-1"></div>
                    </Pulse>
                  </div>
                </div>
                
                {/* Image placeholder skeleton */}
                  <Pulse>
                    <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                  </Pulse>
              </div>
            </div>
          )}
          
            {/* Generated Image Display */}
          {message.generatedImage && (
            <div className="mt-4">
                <div className="relative inline-block">
              <img
                src={`data:image/jpeg;base64,${message.generatedImage}`}
                alt="Generated Image"
                    className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setIsImagePopupOpen(true)}
                  />
                </div>
            </div>
          )}
          
          {/* Image Popup Modal */}
          {(isImagePopupOpen || isImagePopupClosing) && message.generatedImage && (
            <div 
              className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-all duration-200 ease-out ${
                isImagePopupClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={() => {
                setIsImagePopupClosing(true)
                setTimeout(() => {
                  setIsImagePopupOpen(false)
                  setIsImagePopupClosing(false)
                }, 200)
              }}
            >
              <div className={`relative inline-block max-w-4xl max-h-[90vh] transition-all duration-200 ease-out transform ${
                isImagePopupClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
              }`}>
                <img
                  src={`data:image/jpeg;base64,${message.generatedImage}`}
                  alt="Generated Image"
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                />
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsImagePopupClosing(true)
                    setTimeout(() => {
                      setIsImagePopupOpen(false)
                      setIsImagePopupClosing(false)
                    }, 200)
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all duration-200"
                  title="Close"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Download Button */}
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = `data:image/jpeg;base64,${message.generatedImage}`
                    link.download = `generated-image-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="absolute bottom-2 right-2 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all duration-200"
                  title="Download Image"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Sources Display for Web Search Results */}
            {message.sender === 'ai' && message.searchResults && message.searchResults.sources && message.searchResults.sources.length > 0 && !isCurrentlyStreaming && (
              <div 
                className={`transition-all duration-300 ease-out ${
              showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
              <SearchSources 
                sources={message.searchResults.sources}
                query={message.searchResults.query}
              />
              </div>
          )}
          
          {/* Feedback icons for AI messages - moved inside the message bubble */}
            {message.sender === 'ai' && !isCurrentlyStreaming && !message.content.includes('❌') && (
              <div 
                className={`flex items-center mt-3 space-x-2 transition-all duration-300 ease-out ${
              showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
              >
              {/* Copy button with check mark feedback */}
                <button 
                onClick={() => displayContent && handleCopyMessage(message.id, displayContent)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors relative"
                title="Copy message"
                disabled={!displayContent}
              >
                {copiedMessageId === message.id ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
                </button>
              
              {/* Like button with fill effect */}
                <button 
                onClick={() => handleLikeMessage(message.id)}
                className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
                  message.isLiked ? 'bg-blue-50' : ''
                }`}
                title="Like message"
              >
                <ThumbsUp className={`w-5 h-5 transition-colors ${
                  message.isLiked ? 'text-blue-500 fill-current' : 'text-gray-500'
                }`} />
                </button>
              
              {/* Dislike button with fill effect */}
                <button 
                onClick={() => handleDislikeMessage(message.id)}
                className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
                  message.isDisliked ? 'bg-red-50' : ''
                }`}
                title="Dislike message"
              >
                <ThumbsDown className={`w-5 h-5 transition-colors ${
                  message.isDisliked ? 'text-red-500 fill-current' : 'text-gray-500'
                }`} />
                </button>
              
              {/* Voice/TTS button with playing state */}
                <button 
                onClick={() => displayContent && handleVoiceMessage(message.id, displayContent)}
                className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
                  message.isPlayingTTS ? 'bg-green-50' : ''
                }`}
                title="Play message audio"
                disabled={!displayContent}
              >
                <Volume2 className={`w-5 h-5 transition-colors ${
                  message.isPlayingTTS ? 'text-green-500' : 'text-gray-500'
                }`} />
                </button>
              
              {/* Pencil button - opens document editor (disabled for code blocks) */}
                <button 
                onClick={() => handleOpenCanvas(message.id)}
                className={`p-1.5 rounded transition-colors ${
                  hasCodeBlocks(displayContent) || hasTables(displayContent)
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-100'
                }`}
                title={hasCodeBlocks(displayContent) ? "Canvas editor not available for code blocks" : 
                       hasTables(displayContent) ? "Canvas editor not available for tables" : 
                       "Open canvas editor"}
                disabled={hasCodeBlocks(displayContent) || hasTables(displayContent)}
              >
                <Wand2 className={`w-5 h-5 ${
                  hasCodeBlocks(displayContent) || hasTables(displayContent) ? 'text-gray-300' : 'text-gray-500'
                }`} />
                </button>
              
              {/* Share button (placeholder for future functionality) */}
                <button 
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors" 
                  title="Share message"
                >
                <Share2 className="w-5 h-5 text-gray-500" />
                </button>
              
              {/* Regenerate button */}
                <button 
                onClick={() => handleRegenerateMessage(message.id)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Regenerate message"
              >
                <RotateCcw className="w-5 h-5 text-gray-500" />
                </button>
              </div>
          )}
          </div>
        )}
      </div>
    </div>

    {/* Image Popup Modal */}
    <>
      {isImagePopupOpen && message.attachedFile?.type === 'image' && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsImagePopupOpen(false)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={message.attachedFile.preview}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setIsImagePopupOpen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
    </>
  )
} 