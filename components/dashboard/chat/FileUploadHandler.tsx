"use client"

import React, { useState, useCallback } from "react"
import { orphionAIService } from "@/app/services/OrphionAIService"
import { useFileAnalysis } from '@/hooks/useFileAnalysis'

interface FileUploadHandlerProps {
  onFileUpload: (file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => void
  onRemoveFile: () => void
  onFileAnalysisComplete: (analysis: string) => void
  onError: (error: string) => void
}

export default function FileUploadHandler({
  onFileUpload,
  onRemoveFile,
  onFileAnalysisComplete,
  onError
}: FileUploadHandlerProps) {
  const [attachedFile, setAttachedFile] = useState<{ file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' } | null>(null)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [isProcessingDocument, setIsProcessingDocument] = useState(false)

  // Custom hooks
  const { analyzeFile } = useFileAnalysis()

  // Handle file upload
  const handleFileUpload = useCallback((file: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }) => {
    setAttachedFile(file)
    onFileUpload(file)
  }, [onFileUpload])

  // Remove attached file
  const removeAttachedFile = useCallback(() => {
    setAttachedFile(null)
    onRemoveFile()
  }, [onRemoveFile])

  // Analyze uploaded file
  const analyzeUploadedFile = useCallback(async (userMessage?: string) => {
    if (!attachedFile) return

    try {
      let analysis = ''

      switch (attachedFile.type) {
        case 'image':
          setIsAnalyzingImage(true)
          const imageAnalysis = await orphionAIService.analyzeImage(attachedFile.file, userMessage)
          analysis = imageAnalysis.response
          break

        case 'document':
          setIsProcessingDocument(true)
          const documentAnalysis = await orphionAIService.analyzeDocument(attachedFile.file, userMessage)
          analysis = documentAnalysis.response
          break

        case 'pdf':
          setIsProcessingDocument(true)
          const pdfAnalysis = await orphionAIService.analyzePDF(attachedFile.file, userMessage)
          analysis = pdfAnalysis.response
          break

        case 'excel':
          setIsProcessingDocument(true)
          const excelAnalysis = await orphionAIService.analyzeExcel(attachedFile.file, userMessage)
          analysis = excelAnalysis.response
          break

        default:
          throw new Error('Unsupported file type')
      }

      onFileAnalysisComplete(analysis)
    } catch (error) {
      console.error('File analysis error:', error)
      onError('Failed to analyze file. Please try again.')
    } finally {
      setIsAnalyzingImage(false)
      setIsProcessingDocument(false)
    }
  }, [attachedFile, onFileAnalysisComplete, onError])

  // Validate file type
  const validateFileType = useCallback((file: File): 'image' | 'document' | 'pdf' | 'excel' | 'csv' | null => {
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()

    // Image files
    if (fileType.startsWith('image/')) {
      return 'image'
    }

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return 'pdf'
    }

    // Excel files
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      return 'excel'
    }

    // CSV files
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return 'csv'
    }

    // Document files (Word, text, etc.)
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileType === 'text/plain' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.txt')
    ) {
      return 'document'
    }

    return null
  }, [])

  // Create file preview
  const createFilePreview = useCallback((file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    
    // For non-image files, return a placeholder
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f3f4f6"/>
        <text x="50" y="50" font-family="Arial" font-size="12" text-anchor="middle" dy=".3em" fill="#6b7280">
          ${file.name.split('.').pop()?.toUpperCase() || 'FILE'}
        </text>
      </svg>
    `)}`
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileType = validateFileType(file)
    if (!fileType) {
      onError('Unsupported file type. Please upload an image, document, PDF, or Excel file.')
      return
    }

    const preview = createFilePreview(file)
    const fileData = { file, preview, type: fileType }
    
    handleFileUpload(fileData)
  }, [validateFileType, createFilePreview, handleFileUpload, onError])

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    
    const files = event.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    const fileType = validateFileType(file)
    if (!fileType) {
      onError('Unsupported file type. Please upload an image, document, PDF, or Excel file.')
      return
    }

    const preview = createFilePreview(file)
    const fileData = { file, preview, type: fileType }
    
    handleFileUpload(fileData)
  }, [validateFileType, createFilePreview, handleFileUpload, onError])

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return {
    attachedFile,
    isAnalyzingImage,
    isProcessingDocument,
    handleFileUpload,
    removeAttachedFile,
    analyzeUploadedFile,
    handleFileSelect,
    handleDrop,
    handleDragOver
  }
} 