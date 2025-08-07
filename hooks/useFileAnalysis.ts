import { useState } from 'react'
import { orphionAIService } from '@/app/services/OrphionAIService'

interface FileAnalysisState {
  isAnalyzingImage: boolean
  isProcessingDocument: boolean
}

interface FileAnalysisReturn extends FileAnalysisState {
  analyzeFile: (file: File, message: string) => Promise<string>
}

export function useFileAnalysis(): FileAnalysisReturn {
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false)
  const [isProcessingDocument, setIsProcessingDocument] = useState(false)

  const analyzeFile = async (file: File, message: string): Promise<string> => {
    const fileType = getFileType(file)
    
    try {
      switch (fileType) {
        case 'image':
          setIsAnalyzingImage(true)
          const imageAnalysis = await orphionAIService.analyzeImage(file, message)
          setIsAnalyzingImage(false)
          return imageAnalysis.response

        case 'document':
          setIsProcessingDocument(true)
          const documentAnalysis = await orphionAIService.analyzeDocument(file, message)
          setIsProcessingDocument(false)
          return documentAnalysis.response

        case 'pdf':
          setIsProcessingDocument(true)
          const pdfAnalysis = await orphionAIService.analyzePDF(file, message)
          setIsProcessingDocument(false)
          return pdfAnalysis.response

        case 'excel':
        case 'csv':
          setIsProcessingDocument(true)
          const excelAnalysis = await orphionAIService.analyzeExcel(file, message)
          setIsProcessingDocument(false)
          return excelAnalysis.response

        default:
          throw new Error('Unsupported file type')
      }
    } catch (error) {
      // Reset states on error
      setIsAnalyzingImage(false)
      setIsProcessingDocument(false)
      throw error
    }
  }

  const getFileType = (file: File): 'image' | 'document' | 'pdf' | 'excel' | 'csv' => {
    const fileName = file.name.toLowerCase()
    const fileType = file.type.toLowerCase()

    if (fileType.startsWith('image/')) {
      return 'image'
    }

    if (fileName.endsWith('.pdf')) {
      return 'pdf'
    }

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return 'excel'
    }

    if (fileName.endsWith('.csv')) {
      return 'csv'
    }

    // Default to document for other file types
    return 'document'
  }

  return {
    isAnalyzingImage,
    isProcessingDocument,
    analyzeFile
  }
} 