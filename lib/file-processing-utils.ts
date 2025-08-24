// Centralized file processing utilities to prevent duplicate extraction
export interface ProcessedFileContent {
  content: string
  fileName: string
  fileType: string
  timestamp: number
}

export class FileProcessingManager {
  private static instance: FileProcessingManager
  private processedFiles = new Map<string, ProcessedFileContent>()

  static getInstance(): FileProcessingManager {
    if (!FileProcessingManager.instance) {
      FileProcessingManager.instance = new FileProcessingManager()
    }
    return FileProcessingManager.instance
  }

  // Generate a unique key for a file
  generateFileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  // Store processed file content
  storeProcessedContent(file: File, content: string, fileType: string): void {
    const fileKey = this.generateFileKey(file)
    const processedContent: ProcessedFileContent = {
      content,
      fileName: file.name,
      fileType,
      timestamp: Date.now()
    }
    
    this.processedFiles.set(fileKey, processedContent)
    
    // Also store in sessionStorage for persistence across component unmounts
    sessionStorage.setItem(`extracted_${fileKey}`, content)
    sessionStorage.setItem(`extracted_type_${fileKey}`, fileType)
    sessionStorage.setItem(`extracted_timestamp_${fileKey}`, processedContent.timestamp.toString())
  }

  // Get processed file content
  getProcessedContent(file: File): ProcessedFileContent | null {
    const fileKey = this.generateFileKey(file)
    
    // First check memory cache
    const cached = this.processedFiles.get(fileKey)
    if (cached) {
      return cached
    }
    
    // Fall back to sessionStorage
    const storedContent = sessionStorage.getItem(`extracted_${fileKey}`)
    const storedType = sessionStorage.getItem(`extracted_type_${fileKey}`)
    const storedTimestamp = sessionStorage.getItem(`extracted_timestamp_${fileKey}`)
    
    if (storedContent && storedType && storedTimestamp) {
      const processedContent: ProcessedFileContent = {
        content: storedContent,
        fileName: file.name,
        fileType: storedType as any,
        timestamp: parseInt(storedTimestamp)
      }
      
      // Restore to memory cache
      this.processedFiles.set(fileKey, processedContent)
      return processedContent
    }
    
    return null
  }

  // Check if file has been processed
  isFileProcessed(file: File): boolean {
    return this.getProcessedContent(file) !== null
  }

  // Clear processed content for a file
  clearProcessedContent(file: File): void {
    const fileKey = this.generateFileKey(file)
    this.processedFiles.delete(fileKey)
    
    sessionStorage.removeItem(`extracted_${fileKey}`)
    sessionStorage.removeItem(`extracted_type_${fileKey}`)
    sessionStorage.removeItem(`extracted_timestamp_${fileKey}`)
  }

  // Clear all processed content
  clearAllProcessedContent(): void {
    this.processedFiles.clear()
    
    // Clear all extracted items from sessionStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('extracted_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
  }

  // Get processing status for a file
  getProcessingStatus(file: File): {
    isProcessed: boolean
    content: string | null
    fileType: string | null
    timestamp: number | null
  } {
    const processed = this.getProcessedContent(file)
    return {
      isProcessed: processed !== null,
      content: processed?.content || null,
      fileType: processed?.fileType || null,
      timestamp: processed?.timestamp || null
    }
  }
}

// Export singleton instance
export const fileProcessingManager = FileProcessingManager.getInstance()
