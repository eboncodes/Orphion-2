"use client"

import { X, Loader2, FileText, FileSpreadsheet, FileImage } from "lucide-react"

interface FileAttachmentDisplayProps {
  attachedFile: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }
  isAnalyzingImage: boolean
  isProcessingDocument: boolean
  onRemoveFile: () => void
}

export default function FileAttachmentDisplay({
  attachedFile,
  isAnalyzingImage,
  isProcessingDocument,
  onRemoveFile
}: FileAttachmentDisplayProps) {
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <FileImage className="w-4 h-4 text-blue-600" />
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-600" />
      case 'excel':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />
      default:
        return <FileText className="w-4 h-4 text-blue-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeLabel = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return 'Image'
      case 'pdf':
        return 'PDF'
      case 'excel':
        return 'Excel'
      case 'csv':
        return 'CSV'
      default:
        return 'Document'
    }
  }

  return (
    <div className="mb-3 p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg w-fit max-w-full">
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="flex-shrink-0">
          {attachedFile.type === 'image' ? (
            <img
              src={attachedFile.preview}
              alt="Attached file"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center ${
              attachedFile.type === 'pdf' 
                ? 'bg-red-100 border-red-300' 
                : attachedFile.type === 'excel' || attachedFile.type === 'csv'
                ? 'bg-green-100 border-green-300'
                : 'bg-blue-100 border-blue-300'
            }`}>
              {getFileIcon(attachedFile.type)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 max-w-[200px] sm:max-w-[300px]">
          <div className="text-xs sm:text-sm font-medium text-gray-900 break-words leading-tight">
            {attachedFile.file.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {getFileTypeLabel(attachedFile.type)} · {formatFileSize(attachedFile.file.size)}
          </div>
          {(isAnalyzingImage || isProcessingDocument) && (
            <div className="mt-1 text-xs text-blue-600 flex items-center space-x-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">
                {isAnalyzingImage ? 'Analyzing image...' : 'Processing document...'}
              </span>
              <span className="sm:hidden">
                {isAnalyzingImage ? 'Analyzing...' : 'Processing...'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onRemoveFile}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  )
}
