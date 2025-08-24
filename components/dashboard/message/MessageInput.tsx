"use client"

import { forwardRef, useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, ArrowUp, MicOff, X, Loader2, Feather, Globe, Monitor } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import Tooltip from "@/components/ui/tooltip"
import FileAttachment from '../features/ImageAttachment'
import FileAttachmentDisplay from './FileAttachmentDisplay'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { useAuth } from '@/contexts/AuthContext'
import TypingAnimation from '../utils/TypingAnimation'

interface MessageInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  placeholder: string
  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null
  onFileUpload: (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => void
  onRemoveFile: () => void
  isLoading: boolean
  sidebarOpen: boolean
  isAnalyzingImage: boolean
  isProcessingDocument: boolean
  onVoiceInput: (transcript: string) => void
  selectedTool?: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null
  onRemoveTool: () => void
  messages?: any[]
  showGeneratingIndicator?: boolean
  showTools?: boolean
  showFileAttachment?: boolean
  onToolSelect?: (tool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null) => void
}

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(({
  value,
  onChange,
  onKeyDown,
  onSend,
  placeholder,
  attachedFile,
  onFileUpload,
  onRemoveFile,
  isLoading,
  sidebarOpen,
  isAnalyzingImage = false,
  isProcessingDocument = false,
  onVoiceInput,
  selectedTool,
  onRemoveTool,
  messages,
  showGeneratingIndicator = true,
  showTools = true,
  showFileAttachment = true,
  onToolSelect
}, ref) => {
  const { isListening, transcript, startListening, stopListening, resetTranscript, error } = useSpeechToText()
  const [showVoiceError, setShowVoiceError] = useState(false)
  const { isAuthenticated, setShowSignInModal } = useAuth()
  const [showToolsDropdown, setShowToolsDropdown] = useState(false)
  const [showTypingAnimation, setShowTypingAnimation] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const toolsRef = useRef<HTMLDivElement | null>(null)

  const handleToolSelection = (tool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search') => {
    if (onToolSelect) {
      onToolSelect(tool)
    }
    setShowToolsDropdown(false)
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setDragCounter(prev => prev + 1)
      setIsDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount <= 0) {
        setIsDragOver(false)
        return 0
      }
      return newCount
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0] // Only handle the first file for now
      processDroppedFile(file)
    }
  }

  const processDroppedFile = (file: File) => {
    // Determine file type based on extension and MIME type
    const fileName = file.name.toLowerCase()
    const mimeType = file.type.toLowerCase()

    let fileType: 'image' | 'document' | 'pdf' | 'excel' | 'csv' = 'document'

    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName)) {
      fileType = 'image'
    } else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      fileType = 'pdf'
    } else if (
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      /\.(xlsx?|xls|csv)$/i.test(fileName)
    ) {
      fileType = fileName.endsWith('.csv') ? 'csv' : 'excel'
    }

    // Create preview for images
    const createPreview = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        if (fileType === 'image') {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        } else {
          // For non-images, create a generic preview based on file type
          resolve(`data:image/svg+xml;base64,${btoa(`
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="8" fill="#f3f4f6"/>
              <text x="24" y="28" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">
                ${fileType.toUpperCase()}
              </text>
            </svg>
          `)}`)
        }
      })
    }

    createPreview(file).then((preview) => {
      onFileUpload({ file, preview, type: fileType })
    })
  }

  // Handle paste events for images
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Check if there's image data in the clipboard
    const items = Array.from(e.clipboardData.items)

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault() // Prevent default paste behavior

        const file = item.getAsFile()
        if (file) {
          // Process the pasted image
          processDroppedFile(file)
          break // Only process the first image
        }
      }
    }
  }

  // Get dynamic placeholder based on tool selection
  const getDynamicPlaceholder = () => {
    if (selectedTool) {
      return placeholder // Use original placeholder when tool is selected
    }
    return placeholder
  }

  // Auto-resize textarea
  useEffect(() => {
    if (ref && typeof ref === 'object' && ref.current) {
      const textarea = ref.current
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 144 // Maximum height for 5-6 lines
      
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = "auto"
      } else {
        textarea.style.height = `${scrollHeight}px`
        textarea.style.overflowY = "hidden"
      }
    }
  }, [value, ref, attachedFile])

  // Handle voice input
  useEffect(() => {
    if (transcript && onVoiceInput) {
      onVoiceInput(transcript)
      resetTranscript()
    }
  }, [transcript, onVoiceInput, resetTranscript])

  // Handle voice errors
  useEffect(() => {
    if (error) {
      setShowVoiceError(true)
      setTimeout(() => setShowVoiceError(false), 3000)
    }
  }, [error])

  // Hide typing animation when user starts typing or when file is attached
  useEffect(() => {
    if (value.length > 0 || attachedFile) {
      setShowTypingAnimation(false)
    }
  }, [value, attachedFile])

  // Close tools dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
          if (showToolsDropdown && toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
      setShowToolsDropdown(false)
    }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowToolsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showToolsDropdown])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const getToolIcon = (tool: string) => {
    switch (tool) {

      case 'study':
        return (<Feather className="w-4 h-4" />)
      case 'image':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="14" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <path d="M21 15l-5-5L5 21"></path>
          </svg>
        )
      case 'pages':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="14" height="16" rx="2" ry="2"></rect>
            <path d="M7 8h6M7 12h6M7 16h6" />
            <path d="M17 8h4v12a2 2 0 0 1-2 2h-2" />
          </svg>
        )
      case 'table':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
            <path d="M3 10h18M9 4v16M15 4v16" />
          </svg>
        )
      case 'webpage':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
            <path d="M3 8h18" />
            <circle cx="7" cy="6" r="1" />
            <circle cx="11" cy="6" r="1" />
            <circle cx="15" cy="6" r="1" />
          </svg>
        )
      case 'search':
        return (<Globe className="w-4 h-4" />)
      default:
        return null
    }
  }

  const getToolName = (tool: string) => {
    switch (tool) {

      case 'study':
        return 'Study'
      case 'image':
        return 'Image'
      case 'pages':
        return 'Pages'
      case 'table':
        return 'Table'
      case 'webpage':
        return 'Webpage'
      case 'search':
        return 'Web Search'
      default:
        return ''
    }
  }



  return (
    <>
      <div className="relative">
        {/* Message Input Box */}
      <div
        className={`relative bg-white rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 transition-all duration-300 ease-in-out shadow-lg ${
          isDragOver
            ? 'shadow-xl'
            : 'shadow-lg'
        }`}
        data-message-input
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative">
          {/* File Attachment Display */}
          {attachedFile && (
            <div className="flex justify-start">
              <FileAttachmentDisplay
                attachedFile={attachedFile}
                isAnalyzingImage={isAnalyzingImage}
                isProcessingDocument={isProcessingDocument}
                onRemoveFile={onRemoveFile}
              />
            </div>
          )}

          <div className="relative">
            <textarea
              ref={ref}
              value={value}
              onChange={onChange}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && (value.trim() || attachedFile)) {
                  e.preventDefault()
                  if (isAuthenticated) {
                    onKeyDown(e)
                  } else {
                    setShowSignInModal(true)
                  }
                } else {
                  onKeyDown(e)
                }
              }}
              placeholder=""
              className={`w-full border-0 bg-transparent text-sm sm:text-base focus-visible:ring-0 focus-visible:ring-offset-0 resize-none outline-none min-h-[20px] sm:min-h-[24px] max-h-[144px] leading-6`}
              rows={1}
            />
            {!value && !attachedFile && showTypingAnimation && placeholder === "Give Orphion a task to work on" && (
              <div className="absolute top-0 left-0 pointer-events-none text-gray-500 z-10">
                <TypingAnimation 
                  text="Give Orphion a task to work on" 
                  speed={25}
                  showOnce={true}
                />
              </div>
            )}
            {!value && !attachedFile && (!showTypingAnimation || placeholder !== "Give Orphion a task to work on") && (
              <div className="absolute top-0 left-0 pointer-events-none text-gray-500 z-10">
                {placeholder}
              </div>
            )}
            {!value && attachedFile && (
              <div className="absolute top-0 left-0 pointer-events-none text-gray-500 z-10">
                Assign a task or ask anything
              </div>
            )}
          </div>
        </div>

        {/* Bottom Icons */}
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showFileAttachment && !attachedFile && (
              <FileAttachment
                attachedFile={attachedFile}
                isAnalyzingImage={isAnalyzingImage}
                isProcessingDocument={isProcessingDocument}
                onFileUpload={onFileUpload}
                onRemoveFile={onRemoveFile}
              />
            )}
            {showTools && (
              <div ref={toolsRef} className="relative">
                <Tooltip content="Tools" position="top">
                  <div onClick={() => setShowToolsDropdown(!showToolsDropdown)} className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tool-case-icon lucide-tool-case"><path d="M10 15h4"/><path d="m14.817 10.995-.971-1.45 1.034-1.232a2 2 0 0 0-2.025-3.238l-1.82.364L9.91 3.885a2 2 0 0 0-3.625.748L6.141 6.55l-1.725.426a2 2 0 0 0-.19 3.756l.657.27"/><path d="m18.822 10.995 2.26-5.38a1 1 0 0 0-.557-1.318L16.954 2.9a1 1 0 0 0-1.281.533l-.924 2.122"/><path d="M4 12.006A1 1 0 0 1 4.994 11H19a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></svg>
                  </div>
                </Tooltip>
                {showToolsDropdown && (
                  <div className="absolute bottom-full mb-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10">

                    <button
                      onClick={() => handleToolSelection('study')}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Feather className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Study</span>
                    </button>
                    <button
                      onClick={() => handleToolSelection('image')}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="14" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <path d="M21 15l-5-5L5 21"></path>
                      </svg>
                      <span className="text-gray-700">Image</span>
                    </button>
                    <button
                      onClick={() => handleToolSelection('search')}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Globe className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Web Search</span>
                    </button>
                    
                  </div>
                )}
              </div>
            )}

            {/* Selected Tool Display */}
            {selectedTool && onRemoveTool && (
              <div className="flex items-center space-x-2 bg-blue-100 border border-blue-300 rounded-full px-3 py-1 hover:border-blue-400 transition-all duration-200">
                <div className="text-blue-700">
                  {getToolIcon(selectedTool)}
                </div>
                <span className="text-sm font-medium text-blue-800">
                  {getToolName(selectedTool)}
                </span>
                <button
                  onClick={onRemoveTool}
                  className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {showVoiceError && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg">
                {error}
              </div>
            )}
            
            {/* Dynamic Button - Microphone when empty, Send when typed */}
            <Button
              size="sm"
              className={`rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 transition-all duration-200 ${
                value.trim() || attachedFile
                  ? isLoading
                    ? 'bg-gradient-to-br from-gray-200 to-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-white to-black hover:from-gray-100 hover:to-gray-800 text-white'
                  : isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200'
              }`}
              disabled={isLoading}
              onClick={value.trim() || attachedFile ?
                (isAuthenticated ? onSend : () => setShowSignInModal(true)) :
                handleMicClick
              }
              title={value.trim() || attachedFile ?
                isLoading
                  ? 'Generating response...'
                  : (isAuthenticated ? 'Send message' : 'Sign in to send message') :
                isLoading
                  ? 'Generating response...'
                  : (isListening ? 'Stop recording' : 'Start voice input')
              }
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" />
              ) : value.trim() || attachedFile ? (
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              ) : isListening ? (
                <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
              ) : (
                <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
})

MessageInput.displayName = "MessageInput"

export default MessageInput 