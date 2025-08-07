"use client"

import { forwardRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, ArrowUp, MicOff } from "lucide-react"
import FileAttachment from './ImageAttachment'
import ModelSelector, { ModelType } from './ModelSelector'
import { useSpeechToText } from '@/hooks/useSpeechToText'

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
  isAnalyzingImage?: boolean
  isProcessingDocument?: boolean

  selectedModel?: ModelType
  onModelChange?: (model: ModelType) => void
  onVoiceInput?: (transcript: string) => void
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

  selectedModel,
  onModelChange,
  onVoiceInput
}, ref) => {
  const { isListening, transcript, startListening, stopListening, resetTranscript, error } = useSpeechToText()
  const [showVoiceError, setShowVoiceError] = useState(false)
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
  }, [value, ref])

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

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-300 p-4 transition-all duration-300 ease-in-out hover:border-gray-400 focus-within:border-gray-500 focus-within:shadow-lg">
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none outline-none min-h-[24px] max-h-[144px] leading-6"
        rows={1}
      />

      {/* Bottom Icons */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4">
          <FileAttachment
            attachedFile={attachedFile}
            isAnalyzingImage={isAnalyzingImage}
            isProcessingDocument={isProcessingDocument}
            onFileUpload={onFileUpload}
            onRemoveFile={onRemoveFile}
          />
          


          {/* Model Selector */}
          {selectedModel && onModelChange && (
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          )}
        </div>

        <div className="flex items-center space-x-3">
          {showVoiceError && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg">
              {error}
            </div>
          )}
          
          {/* Dynamic Button - Microphone when empty, Send when typed */}
          <Button
            size="sm"
            className={`rounded-full w-8 h-8 p-0 transition-all duration-200 ${
              value.trim() || attachedFile
                ? 'bg-black hover:bg-gray-800'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            disabled={isLoading}
            onClick={value.trim() || attachedFile ? onSend : handleMicClick}
            title={value.trim() || attachedFile ? 'Send message' : (isListening ? 'Stop recording' : 'Start voice input')}
          >
            {value.trim() || attachedFile ? (
              <ArrowUp className="w-4 h-4 text-white" />
            ) : isListening ? (
              <MicOff className="w-4 h-4 text-red-500" />
            ) : (
              <Mic className="w-4 h-4 text-gray-600" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
})

MessageInput.displayName = "MessageInput"

export default MessageInput 