"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Undo, Redo, Download, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Save, ChevronDown } from 'lucide-react'
import 'katex/dist/katex.min.css'
import { renderFormattedContent } from './KaTeXRenderer'
import React from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface CanvasProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (documentData: string) => void
  aiMessageContent?: string
  messageId?: string // Add messageId to know which message to update
  onMessageUpdate?: (messageId: string, newContent: string) => void // Add callback for message updates
}

export default function Canvas({ isOpen, onClose, onSave, aiMessageContent, messageId, onMessageUpdate }: CanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [renderedContent, setRenderedContent] = useState<React.ReactNode>(null)
  const [originalContent, setOriginalContent] = useState<string>('')
  const [originalFullContent, setOriginalFullContent] = useState<string>('') // Store full content with thinking tags
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setHasChanges(false) // Reset changes when opening
      if (aiMessageContent) {
        // Store the original display content for comparison
        setOriginalContent(aiMessageContent)
        
        // Get the original full content from the dashboard
        const messageUpdateCallback = (window as any).__messageUpdateCallback?.current
        if (messageUpdateCallback && messageId) {
          // We need to get the original full content from the dashboard
          // For now, we'll store the display content and reconstruct later
          setOriginalFullContent(aiMessageContent) // This will be the display content
        }
        
        // Render the formatted content using React
        const formattedContent = renderFormattedContent(aiMessageContent, 'ai')
        setRenderedContent(formattedContent)
        
        // Load and render KaTeX math after a short delay
        setTimeout(() => {
          const loadKaTeX = async () => {
            try {
              // Load KaTeX CSS if not already loaded
              if (!document.querySelector('link[href*="katex"]')) {
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
                document.head.appendChild(link)
              }
              
              // Load KaTeX from CDN if not already loaded
              if (!(window as any).katex) {
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
                script.onload = () => {
                  setTimeout(renderKaTeX, 100)
                }
                document.head.appendChild(script)
              } else {
                setTimeout(renderKaTeX, 100)
              }
            } catch (error) {
              console.error('Error loading KaTeX:', error)
            }
          }
          
          const renderKaTeX = () => {
            try {
              const mathElements = editorRef.current?.querySelectorAll('[data-math]')
              if (mathElements && (window as any).katex) {
                mathElements.forEach((element) => {
                  const math = element.getAttribute('data-math')
                  if (math) {
                    try {
                      (window as any).katex.render(math, element, {
                        displayMode: element.classList.contains('katex-display'),
                        throwOnError: false
                      })
                } catch (error) {
                  console.error('KaTeX rendering error:', error)
                    }
                }
              })
              }
            } catch (error) {
              console.error('Error rendering KaTeX:', error)
            }
          }
          
          loadKaTeX()
        }, 100)
        } else {
        setRenderedContent(<p>Start editing here...</p>)
      }
    } else {
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isOpen, aiMessageContent])

  // Handle clicking outside download menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.download-menu-container')) {
        setShowDownloadMenu(false)
      }
    }

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadMenu])

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
    document.execCommand(command, false, value)
    }
  }

  // Check if content has changed
  const checkForChanges = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML
      
      // Extract plain text from HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      
      // Get the text content, preserving line breaks
      let currentText = tempDiv.textContent || tempDiv.innerText || ''
      
      // Clean up extra whitespace and normalize line breaks
      currentText = currentText
        .replace(/\n\s*\n/g, '\n\n') // Remove extra blank lines
        .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to max 2
      
      // Compare with original content
      const hasChanged = currentText !== originalContent
      setHasChanges(hasChanged)
    }
  }

  const saveDocument = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML
      
      // Extract content while preserving math delimiters and formatting
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      
      // Function to extract text while preserving math delimiters and original text
      const extractTextWithMath = (element: Element): string => {
        let result = ''
        
        // Process child nodes in order to maintain text flow
        for (const child of element.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            result += child.textContent || ''
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as Element
            
            // Handle KaTeX math elements - extract the original LaTeX from data attributes if available
            if (el.classList.contains('katex-display')) {
              // Try to get the original LaTeX from data attributes in parent elements
              const parentWithData = el.closest('[data-original-math]')
              const originalMath = parentWithData?.getAttribute('data-original-math') || el.textContent || ''
              result += `$$${originalMath}$$`
            } else if (el.classList.contains('katex')) {
              // Try to get the original LaTeX from data attributes in parent elements
              const parentWithData = el.closest('[data-original-math]')
              const originalMath = parentWithData?.getAttribute('data-original-math') || el.textContent || ''
              result += `$${originalMath}$`
            } else if (el.tagName === 'BR') {
              result += '\n'
            } else if (el.tagName === 'DIV' || el.tagName === 'P') {
              const childText = extractTextWithMath(el)
              if (childText.trim()) {
                result += childText + '\n'
              }
            } else if (el.tagName === 'TABLE') {
              // Convert HTML table back to markdown format
              result += convertTableToMarkdown(el)
            } else if (el.classList.contains('overflow-x-auto') && el.hasAttribute('data-original-table')) {
              // Use the original table markdown if available
              const originalTable = el.getAttribute('data-original-table') || ''
              result += originalTable + '\n'
            } else {
              // For other elements, recursively extract text
              result += extractTextWithMath(el)
            }
          }
        }
        
        return result
      }
      
      // Function to convert HTML table back to markdown format
      const convertTableToMarkdown = (tableElement: Element): string => {
        const rows = tableElement.querySelectorAll('tr')
        if (rows.length === 0) return ''
        
        let markdownTable = ''
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const cells = row.querySelectorAll('th, td')
          
          if (cells.length === 0) continue
          
          // Start the row with |
          markdownTable += '|'
          
          // Add each cell
          for (const cell of cells) {
            const cellText = cell.textContent || ''
            // Escape any | characters in the cell content
            const escapedText = cellText.replace(/\|/g, '\\|')
            markdownTable += ` ${escapedText} |`
          }
          
          markdownTable += '\n'
          
          // Add separator row after header (first row)
          if (i === 0) {
            markdownTable += '|'
            for (let j = 0; j < cells.length; j++) {
              markdownTable += ' --- |'
            }
            markdownTable += '\n'
          }
        }
        
        return markdownTable
      }
      
      let plainText = extractTextWithMath(tempDiv)
      
      // Clean up extra whitespace and normalize line breaks
      plainText = plainText
        .replace(/\n\s*\n/g, '\n\n') // Remove extra blank lines
        .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to max 2
      
      // Since we're now getting display content only, we need to check if the original
      // message had thinking content by looking at the original full content
      // For now, we'll just save the display content and let the message update
      // handle the thinking preservation
      
      // Use the message update callback if available, otherwise fall back to onSave
      if (onMessageUpdate && messageId) {
        onMessageUpdate(messageId, plainText)
      } else if (onSave) {
        onSave(plainText)
      }
      
      setHasChanges(false)
    }
  }

  const downloadDocument = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      const blob = new Blob([content], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'document.html'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const exportAsPDF = async () => {
    if (editorRef.current) {
      setIsExporting(true)
      try {
        // Wait a bit for KaTeX to fully render
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const canvas = await html2canvas(editorRef.current, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: editorRef.current.scrollWidth,
          height: editorRef.current.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          logging: false,
          removeContainer: true
        })
        
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        
        // Calculate dimensions to fit content properly
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const margin = 15 // 15mm margin on each side
        
        const contentWidth = pageWidth - (2 * margin)
        const contentHeight = pageHeight - (2 * margin)
        
        // Calculate scaling to fit the image properly
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        
        // Calculate the scale to fit the image within the page
        const scaleX = contentWidth / imgWidth
        const scaleY = contentHeight / imgHeight
        const scale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down
        
        const finalWidth = imgWidth * scale
        const finalHeight = imgHeight * scale
        
        // Center the image on the page
        const x = margin + (contentWidth - finalWidth) / 2
        const y = margin + (contentHeight - finalHeight) / 2
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
        
        pdf.save('document.pdf')
      } catch (error) {
        console.error('Error exporting PDF:', error)
        alert('Failed to export PDF. Please try again.')
      } finally {
        setIsExporting(false)
      }
    }
  }

  const exportAsWord = async () => {
    if (editorRef.current) {
      setIsExporting(true)
      try {
        const content = editorRef.current.innerHTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content
        
        // Convert HTML to Word document structure
        const children: any[] = []
        
        // Process each child element
        for (const child of tempDiv.childNodes) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as Element
            
            if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
              children.push(
                new Paragraph({
                  text: element.textContent || '',
                  heading: element.tagName === 'H1' ? HeadingLevel.HEADING_1 : 
                          element.tagName === 'H2' ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
                })
              )
            } else if (element.tagName === 'P' || element.tagName === 'DIV') {
              const runs: TextRun[] = []
              
              // Process text nodes and formatting elements
              const processNode = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  const text = node.textContent || ''
                  if (text.trim()) {
                    runs.push(new TextRun({ text }))
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  const textElement = node as Element
                  const text = textElement.textContent || ''
                  
                  if (textElement.tagName === 'STRONG' || textElement.tagName === 'B') {
                    runs.push(new TextRun({ text, bold: true }))
                  } else if (textElement.tagName === 'EM' || textElement.tagName === 'I') {
                    runs.push(new TextRun({ text, italics: true }))
                  } else if (textElement.tagName === 'U') {
                    runs.push(new TextRun({ text, underline: {} }))
                  } else if (textElement.tagName === 'CODE') {
                    runs.push(new TextRun({ text, font: 'Courier New' }))
                  } else if (textElement.classList.contains('katex')) {
                    // Handle math equations - extract the LaTeX
                    const originalMath = textElement.closest('[data-original-math]')?.getAttribute('data-original-math') || text
                    runs.push(new TextRun({ text: `$${originalMath}$`, font: 'Cambria Math' }))
                  } else {
                    // Recursively process child nodes for nested formatting
                    for (const childNode of textElement.childNodes) {
                      processNode(childNode)
                    }
                  }
                }
              }
              
              // Process all child nodes of the paragraph
              for (const node of element.childNodes) {
                processNode(node)
              }
              
              if (runs.length > 0) {
                children.push(new Paragraph({ children: runs }))
              } else if (element.textContent?.trim()) {
                children.push(new Paragraph({ text: element.textContent.trim() }))
              }
            } else if (element.tagName === 'BR') {
              children.push(new Paragraph({ text: '' }))
            } else if (element.tagName === 'TABLE') {
              // Handle tables - convert to simple text representation
              const tableText = element.textContent || ''
              if (tableText.trim()) {
                children.push(new Paragraph({ text: tableText.trim() }))
              }
            } else {
              // Handle other elements as plain text
              const text = element.textContent?.trim()
              if (text) {
                children.push(new Paragraph({ text }))
              }
            }
          } else if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim()
            if (text) {
              children.push(new Paragraph({ text }))
            }
          }
        }
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: children
          }]
        })
        
        const blob = await Packer.toBlob(doc)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'document.docx'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error exporting Word document:', error)
        alert('Failed to export Word document. Please try again.')
      } finally {
        setIsExporting(false)
      }
    }
  }



  if (!isOpen && !isVisible) return null

  return (
    <div 
      className={`fixed right-0 top-0 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`} 
      style={{ width: '700px' }} 
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Bar with Formatting Tools */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-1">
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyLeft')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            className="p-2 hover:bg-gray-100 rounded"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          

        </div>
        
        <div className="flex items-center space-x-1">
          {/* Document Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (editorRef.current) {
                document.execCommand('undo')
              }
            }}
            className="p-2 hover:bg-gray-100 rounded"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (editorRef.current) {
                document.execCommand('redo')
              }
            }}
            className="p-2 hover:bg-gray-100 rounded"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={saveDocument} 
            className={`p-2 rounded transition-colors ${
              hasChanges 
                ? 'hover:bg-gray-100 text-gray-700' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title={hasChanges ? "Save changes" : "No changes to save"}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4" />
          </Button>
          <div className="relative download-menu-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className={`p-2 rounded flex items-center space-x-1 ${
                isExporting ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
              title={isExporting ? "Export in progress..." : "Export options"}
              disabled={isExporting}
            >
              <Download className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </Button>
            
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px]">
                <button
                  onClick={() => {
                    exportAsPDF()
                    setShowDownloadMenu(false)
                  }}
                  disabled={isExporting}
                  className={`w-full px-4 py-2 text-left text-sm border-b border-gray-100 ${
                    isExporting ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  {isExporting ? 'Exporting PDF...' : 'Export as PDF'}
                </button>
                <button
                  onClick={() => {
                    exportAsWord()
                    setShowDownloadMenu(false)
                  }}
                  disabled={isExporting}
                  className={`w-full px-4 py-2 text-left text-sm border-b border-gray-100 ${
                    isExporting ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  {isExporting ? 'Exporting Word...' : 'Export as Word'}
                </button>
                <button
                  onClick={() => {
                    downloadDocument()
                    setShowDownloadMenu(false)
                  }}
                  disabled={isExporting}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    isExporting ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  Export as HTML
                </button>
              </div>
            )}
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div 
          ref={editorRef}
          className="min-h-full outline-none"
          contentEditable={true}
          onInput={() => checkForChanges()}
          suppressContentEditableWarning={true}
        >
          {renderedContent}
        </div>
      </div>
    </div>
  )
} 