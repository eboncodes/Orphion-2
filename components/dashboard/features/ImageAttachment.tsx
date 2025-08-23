"use client"

import { useState, useRef, useEffect } from "react"
import { Paperclip, X, FileText, Image as ImageIcon, BarChart3, Monitor } from "lucide-react"
import GoogleDrivePicker from './GoogleDrivePicker'
import { Spinner } from "@/components/ui/spinner"

interface AttachedFile {
  file: File
  preview: string
  type: 'image' | 'document' | 'pdf' | 'excel' | 'csv'
}

interface FileAttachmentProps {
  attachedFile: AttachedFile | null
  isAnalyzingImage?: boolean
  isProcessingDocument?: boolean
  onFileUpload: (file: AttachedFile) => void
  onRemoveFile: () => void
  className?: string
}

export default function FileAttachment({
  attachedFile,
  isAnalyzingImage = false,
  isProcessingDocument = false,
  onFileUpload,
  onRemoveFile,
  className = ""
}: FileAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDrive, setShowDrive] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        let fileType: 'image' | 'document' | 'pdf' | 'excel' | 'csv' = 'document'
        
        // Determine file type
        if (file.type.startsWith('image/')) {
          fileType = 'image'
        } else if (file.type === 'application/pdf') {
          fileType = 'pdf'
        } else if (file.type === 'application/vnd.ms-excel' ||
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel.sheet.macroEnabled.12' ||
                   file.type === 'application/vnd.ms-excel.template.macroEnabled.12') {
          fileType = 'excel'
        } else if (file.type === 'text/csv' || 
                   (file.type === 'text/plain' && file.name.toLowerCase().endsWith('.csv'))) {
          fileType = 'csv'
        } else if (file.type === 'text/plain' || 
                   file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          fileType = 'document'
        } else {
          // Unsupported file type
          return
        }
        
        onFileUpload({
          file,
          preview: e.target?.result as string,
          type: fileType
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleDrivePick = (file: AttachedFile) => {
    onFileUpload(file)
  }

  // Close dropdown on outside click / Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showMenu) return
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showMenu])

  const getFileIcon = () => {
    if (!attachedFile) return <Paperclip className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
    
    if (attachedFile.type === 'image') {
      return <ImageIcon className="w-4 h-4 text-blue-600" />
    } else if (attachedFile.type === 'pdf') {
      return <FileText className="w-4 h-4 text-red-600" />
    } else if (attachedFile.type === 'excel' || attachedFile.type === 'csv') {
      return <BarChart3 className="w-4 h-4 text-green-600" />
    } else {
      return <FileText className="w-4 h-4 text-blue-600" />
    }
  }

  const getProcessingText = () => {
    if (isAnalyzingImage) return "Analyzing..."
    if (isProcessingDocument) return "Processing..."
    return ""
  }

  const isProcessing = isAnalyzingImage || isProcessingDocument

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.xlsm,.xltx,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {attachedFile ? (
        <div className="relative group">
          {attachedFile.type === 'image' ? (
            <img
              src={attachedFile.preview}
              alt="Attached file"
              className="w-8 h-8 rounded-lg object-cover border border-gray-200 shadow-sm cursor-pointer"
              onClick={triggerFileUpload}
            />
          ) : (
            <div className={`w-8 h-8 rounded-lg border shadow-sm cursor-pointer flex items-center justify-center ${
              attachedFile.type === 'pdf' 
                ? 'bg-red-100 border-red-200' 
                : attachedFile.type === 'excel' || attachedFile.type === 'csv'
                ? 'bg-green-100 border-green-200'
                : 'bg-blue-100 border-blue-200'
            }`}>
              {getFileIcon()}
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
            <button
              onClick={onRemoveFile}
              className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-sm"
            >
              <X className="w-2 h-2" />
            </button>
          </div>
          {isProcessing && (
            <div className="absolute -bottom-6 left-0 bg-gray-800 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
              {getProcessingText()}
            </div>
          )}
        </div>
      ) : (
        <>
        <Paperclip 
          className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" 
            onClick={() => setShowMenu(v => !v)}
            title="Attach"
          />
          {showMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20">
              <button
                onClick={() => { setShowMenu(false); triggerFileUpload() }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <Monitor className="w-4 h-4 text-gray-600" />
                <span>Upload from Computer</span>
              </button>

              {/* Half cut line divider */}
              <div className="my-2 border-t border-gray-200"></div>

              <button
                onClick={() => { setShowMenu(false); setShowDrive(true) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path fill="#1e88e5" d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61 c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z"></path>
                  <path fill="#fbc02d" d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996 c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z"></path>
                  <path fill="#e53935" d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z"></path>
                  <path fill="#4caf50" d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996 c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z"></path>
                  <path fill="#1565c0" d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z"></path>
                  <path fill="#2e7d32" d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z"></path>
                </svg>
                <span>Upload from Google Drive</span>
              </button>
            </div>
          )}
        </>
      )}

      <GoogleDrivePicker
        isOpen={showDrive}
        onClose={() => setShowDrive(false)}
        onPick={handleDrivePick}
      />
    </div>
  )
} 