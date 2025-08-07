"use client"

import { useState, useRef } from "react"
import { Paperclip, X, FileText, Image as ImageIcon, BarChart3 } from "lucide-react"
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
    <div className={`relative ${className}`}>
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
              <div className="flex items-center">
                <Spinner size="sm" className="border-white mr-1" />
                {getProcessingText()}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Paperclip 
          className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" 
          onClick={triggerFileUpload}
        />
      )}
    </div>
  )
} 