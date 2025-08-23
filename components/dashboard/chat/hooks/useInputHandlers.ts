import { useCallback } from 'react'

interface UseInputHandlersProps {
  message: string
  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null
  selectedTool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null
  setMessage: (message: string) => void
  setAttachedFile: (file: any) => void
  setSelectedTool: (tool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null) => void
  setSelectedMode?: (mode: 'auto' | 'agent' | 'chat') => void
  sendMessageInternal: () => Promise<void>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export function useInputHandlers({
  message,
  attachedFile,
  selectedTool,
  setMessage,
  setAttachedFile,
  setSelectedTool,
  setSelectedMode,
  sendMessageInternal,
  textareaRef
}: UseInputHandlersProps) {
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }, [setMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageInternal()
    }
  }, [sendMessageInternal])

  const handleSendMessage = useCallback(() => {
    if (!message.trim() && !attachedFile) return
    sendMessageInternal()
  }, [message, attachedFile, sendMessageInternal])

  const handleFileUpload = useCallback((file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => {
    setAttachedFile(file)
  }, [setAttachedFile])

  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null)
  }, [setAttachedFile])

  const handleToolSelect = useCallback((tool: 'study' | 'image' | 'pages' | 'table' | 'webpage' | 'search' | null) => {
    setSelectedTool(tool)
  }, [setSelectedTool])

  const handleRemoveTool = useCallback(() => {
    setSelectedTool(null)
  }, [setSelectedTool])

  const handleModeChange = useCallback((mode: 'auto' | 'agent' | 'chat') => {
    setSelectedMode?.(mode)
  }, [setSelectedMode])

  const handleVoiceInput = useCallback((transcript: string) => {
    setMessage(transcript)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [setMessage, textareaRef])

  const handlePromptClick = useCallback((prompt: string) => {
    setMessage(prompt)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [setMessage, textareaRef])

  const getPlaceholderText = useCallback((isConversationState = false) => {
    if (attachedFile) {
      return `Ask about the ${attachedFile.type} file...`
    }
    
    if (selectedTool) {
      const toolDescriptions = {

        'study': 'Ask for help with studying...',
        'image': 'Describe the image you want to generate...',
        'pages': 'Describe the page/document you want to create...',
        'table': 'Describe the table you want generated...',
        'webpage': 'Describe the webpage you want generated...',
        'search': 'Enter a query to search the web...'
      }
      return toolDescriptions[selectedTool]
    }
    
    if (isConversationState) {
      return "Continue the conversation..."
    }
    
    return "Ask Orphion anything..."
  }, [attachedFile, selectedTool])

  return {
    handleTextareaChange,
    handleKeyDown,
    handleSendMessage,
    handleFileUpload,
    removeAttachedFile,
    handleToolSelect,
    handleRemoveTool,
    handleModeChange,
    handleVoiceInput,
    handlePromptClick,
    getPlaceholderText
  }
} 