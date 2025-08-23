"use client"

import React, { useState } from "react"
import { renderFormattedContent } from '../../utils/KaTeXRenderer'

import SearchRequestPill from '../../pills/SearchRequestPill'
import ThinkingLoader from '../../chat/ThinkingLoader'
import CodeExecutionPill from '../../pills/CodeExecutionPill'
import TextFilePill from '../../pills/TextFilePill'
import TaskCreationPill from '../../pills/TaskCreationPill'
import PageCreationPill from '../../pills/PageCreationPill'
import StreamingText from './StreamingText'


import { Spinner } from '@/components/ui/spinner'
import { Pulse } from '@/components/ui/pulse'
import { containsBengali, getFontClass } from '@/lib/bengali-utils'
import { MessageContentProps } from '../types'
import FadeInImage from './FadeInImage'
import MonacoEditor from '../../features/MonacoEditor';
import SearchResults from './SearchResults'
import ImageGenerationPill from '../../pills/ImageGenerationPill'

// Helper function to ensure content is always a string
const ensureStringContent = (content: any): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content === 'object') {
    // Try to extract meaningful content from object
    return content.text ||
           content.message ||
           content.content ||
           content.body ||
           JSON.stringify(content);
  }
  // For any other type, convert to string
  return String(content);
};

export default function MessageContent({
  message,
  displayContent,
  isLoading,
  onPageCreated,
  onImageClick
}: MessageContentProps) {
  const isUserMessage = message.sender === 'user'

  // Ensure displayContent is always a string
  const safeDisplayContent = ensureStringContent(displayContent)
  // Separate expansion states for single-search and multi-search items
  const [isSingleSearchExpanded, setIsSingleSearchExpanded] = useState(false)
  const [multiSearchExpanded, setMultiSearchExpanded] = useState<Record<number, boolean>>({})
  
  // Extract executable code if available
  const executableCode = message.executableCode;
  const generatedImages = (message as any).generatedImages as Array<{ src: string; alt?: string }> | undefined
  const [isCodeExpanded, setIsCodeExpanded] = useState(false)
  const imagePrompt = (message as any).imagePrompt as string | undefined
  const imageGenerationCompleted = (message as any).imageGenerationCompleted as boolean | undefined

  // Extract page creation information from content
  const pageMatch = safeDisplayContent?.match(/<PAGE>([\s\S]*?)<\/PAGE>/)
  const pageInfo = pageMatch ? (() => {
    const pageContent = pageMatch[1].trim()

    // Extract a title from the content (first line or first 50 characters)
    const getTitle = (text: string) => {
      const cleanText = text
        .replace(/^#+\s*/gm, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links

      const lines = cleanText.split('\n')
      const firstLine = lines[0].trim()
      if (firstLine.length > 50) {
        return firstLine.substring(0, 50) + '...'
      }
      return firstLine || 'Document Content'
    }

    return {
      title: getTitle(pageContent),
      content: pageContent
    }
  })() : null

  // Extract task creation information from content
  const taskCreateMatch = safeDisplayContent?.match(/<TASK_CREATE>(.*?)<\/TASK_CREATE>/)
  const taskCreationInfo = taskCreateMatch ? (() => {
    const taskContent = taskCreateMatch[1].trim()
    const taskParts = taskContent.split(':')
    if (taskParts.length >= 2) {
      return {
        type: taskParts[0].trim(),
        query: taskParts.slice(1).join(':').trim()
      }
    }
    return null
  })() : null

  // Extract text file information from content (supports <TEXT_FILE>, <TEXT FILE>, <TEXTFILE> with optional attributes like name="...")
  const textFileMatch = safeDisplayContent?.match(/<TEXT[_\s]?FILE\b([^>]*)>([\s\S]*?)<\/TEXT[_\s]?FILE>/i)

  const textFileInfo = textFileMatch ? (() => {
    const attrs = (textFileMatch[1] || '').trim()
    const fileContent = textFileMatch[2].trim()

    const lines = fileContent.split('\n')

    const filenameMatch = lines.find(line => line.startsWith('Filename:'))
    const sourcesMatch = lines.find(line => line.startsWith('Sources:'))

    // Try to extract filename from tag attributes first
    let filenameAttr: string | null = null
    const nameAttrMatch = attrs.match(/(?:name|filename)\s*=\s*(["'])(.*?)\1/i)
    if (nameAttrMatch) {
      filenameAttr = nameAttrMatch[2].trim()
    }

    // Generate a default filename if not found elsewhere
    let filename = filenameAttr || 'generated-text-file.txt'
    if (!filenameAttr && filenameMatch) {
      filename = filenameMatch.replace('Filename:', '').trim()
    } else if (!filenameAttr) {
      // Try to extract filename from the first line if it looks like a title
      const firstLine = lines[0]?.trim()
      if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        filename = firstLine.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '.txt'
        if (filename.length > 50) {
          filename = filename.substring(0, 45) + '.txt'
        }
      }
    }

      // Extract content - handle both formatted and unformatted content
      let content = ''
      const contentStartIndex = lines.findIndex(line => line.startsWith('Content:'))

      if (contentStartIndex !== -1) {
        // Structured format with "Content:" prefix
        const contentLine = lines[contentStartIndex]
        const contentAfterColon = contentLine.replace('Content:', '').trim()

        // Get all lines after "Content:" until we hit "Sources:" or end
        const contentLines = [contentAfterColon] // Start with content from the same line
        for (let i = contentStartIndex + 1; i < lines.length; i++) {
          const line = lines[i]
          if (line.startsWith('Sources:') || line.startsWith('Filename:')) {
            break
          }
          contentLines.push(line)
        }
        content = contentLines.join('\n').trim()
      } else {
        // Unstructured format - use the entire content (excluding Sources if present)
        let endIndex = lines.length
        if (sourcesMatch) {
          endIndex = lines.findIndex(line => line.startsWith('Sources:'))
        }
        content = lines.slice(0, endIndex).join('\n').trim()
      }

      // Parse sources if available
      let sources: Array<{title: string, url: string}> = []
      if (sourcesMatch) {
        const sourcesStartIndex = lines.findIndex(line => line.startsWith('Sources:'))
        if (sourcesStartIndex !== -1) {
          const sourcesLines = lines.slice(sourcesStartIndex + 1)
          sources = sourcesLines
            .filter(line => line.includes('(') && line.includes(')'))
            .map(line => {
              const match = line.match(/(\d+)\.\s*(.*?)\s*\((.*?)\)/)
              if (match) {
                return {
                  title: match[2].trim(),
                  url: match[3].trim()
                }
              }
              return null
            })
            .filter(Boolean) as Array<{title: string, url: string}>
        }
      }

      // Only return if we have content
      if (content) {
        const result = {
          filename,
          content,
          sources
        }
        return result
      }

      return null
  })() : null

  return (
    <div className={`text-base transition-all duration-500 ${getFontClass(safeDisplayContent)} ${
      isUserMessage ? 'leading-tight' : 'leading-relaxed'
    }`}>

      
      {safeDisplayContent && safeDisplayContent.trim() && !message.type && (
        <div className="content">
          {isLoading ? (
            <>
              <StreamingText text={safeDisplayContent} />
            </>
          ) : (
            renderFormattedContent(
              safeDisplayContent
                .replace(/<think>[\s\S]*?<\/think>/gi, '')
                .replace(/<think>/gi, '')
                .replace(/<\/think>/gi, '')
                .replace(/<SEARCHREQUEST>.*?<\/SEARCHREQUEST>/gi, '') // Remove search request tags from display
                .replace(/<TEXT[_\s]?FILE\b[^>]*>[\s\S]*?<\/TEXT[_\s]?FILE>/gi, '') // Remove text file tags from display
                .replace(/<TASK_CREATE>.*?<\/TASK_CREATE>/gi, '') // Remove task creation tags from display
                .replace(/<PAGE>[\s\S]*?<\/PAGE>/gi, '') // Remove page tags from display
                .replace(/<IMG>.*?<\/IMG>/gi, '') // Remove image request tags from display
                .trim(),
              message.sender
            )
          )}
        </div>
      )}
      
      {/* Task Creation Pill */}
      {message.sender === 'ai' && taskCreationInfo && (
        <div className="mt-4">
          <TaskCreationPill
            taskType={taskCreationInfo.type}
            taskQuery={taskCreationInfo.query}
            isProcessing={isLoading || false}
            isCompleted={!isLoading}
          />
        </div>
      )}
      
      {/* Search Request Pill */}
      {message.sender === 'ai' && message.searchRequest && (
        <div className="mt-4">
          <SearchRequestPill
            searchQuery={message.searchRequest}
            isSearching={!message.searchCompleted}
            isCompleted={message.searchCompleted || false}
            isExpanded={isSingleSearchExpanded}
            onToggle={() => setIsSingleSearchExpanded(prev => !prev)}
          />
          {message.searchCompleted && message.searchResults && isSingleSearchExpanded && (
            <div className="mt-3">
              <SearchResults
                images={message.searchResults.images}
                sources={message.searchResults.sources}
                query={message.searchResults.query}
              />
            </div>
          )}
        </div>
      )}

      {/* Image Generation Pill */}
      {message.sender === 'ai' && imagePrompt && (
        <div className="mt-4">
          <ImageGenerationPill
            isGenerating={!imageGenerationCompleted}
            isCompleted={!!imageGenerationCompleted}
          />
        </div>
      )}

      {/* Multi-search pills (sequential) */}
      {message.sender === 'ai' && Array.isArray((message as any).multiSearch) && (message as any).multiSearch!.length > 0 && (
        <div className="mt-2 space-y-2">
          {(message as any).multiSearch!.map((s: any, idx: number) => (
            <div key={idx}>
              <SearchRequestPill
                searchQuery={s.query}
                isSearching={!s.completed}
                isCompleted={!!s.completed}
                isExpanded={!!multiSearchExpanded[idx]}
                onToggle={() => setMultiSearchExpanded(prev => ({ ...prev, [idx]: !prev[idx] }))}
              />
              {s.completed && s.results && !!multiSearchExpanded[idx] && (
                <div className="mt-3">
                  <SearchResults
                    images={s.results.images}
                    sources={s.results.sources}
                    query={s.results.query}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Code Execution Pill */}
      {message.sender === 'ai' && executableCode && (
        <div className="mt-3">
          <CodeExecutionPill
            code={executableCode.code}
            language={executableCode.language}
            isExecuting={!!message.codeExecuting && !message.codeExecuted}
            isCompleted={!!message.codeExecuted}
            isExpanded={isCodeExpanded}
            onToggle={() => setIsCodeExpanded(prev => !prev)}
          />
          {message.codeExecuted && isCodeExpanded && (
            <div className="mt-3">
              <MonacoEditor
                code={executableCode.code}
                language={executableCode.language}
                height="300px"
                readOnly={true}
                showActions={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Show thinking (finalizing) below code execution */}
      {message.sender === 'ai' && (message as any).isFinalizing && (
        <div className="mt-2">
          <ThinkingLoader />
        </div>
      )}


      
      {/* Search results now render under the search pill when completed */}

      {/* Text File Pill */}
      {message.sender === 'ai' && textFileInfo && (
        <div className="mt-4">
          <TextFilePill
            filename={textFileInfo.filename}
            content={textFileInfo.content}
            sources={textFileInfo.sources}
          />
        </div>
      )}
      
      {/* Page Creation Pill */}
      {message.sender === 'ai' && pageInfo && (
        <div className="mt-4">
          <PageCreationPill
            pageTitle={pageInfo.title}
            isProcessing={isLoading || false}
            isCompleted={!isLoading}
            onClick={() => {
              if (onPageCreated) {
                // Use the pageId from the message if available, otherwise use message ID
                const pageId = message.pageId || message.id
                onPageCreated(pageId, pageInfo.title, pageInfo.content)
              }
            }}
          />
        </div>
      )}
      
      {/* Note: Code editor now shown under CodeExecutionPill upon expand */}

      {/* Render generated images (from code execution or image generation) */}
      {Array.isArray(generatedImages) && generatedImages.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {generatedImages.map((img, idx) => (
            <button key={idx} type="button" className="w-full text-left" onClick={() => onImageClick?.(idx)}>
              <FadeInImage
                src={img.src}
                alt={img.alt || `Generated image ${idx + 1}`}
                className="w-full h-auto rounded-lg border border-gray-200 object-contain"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Show placeholder when there's only an attached file but no text */}
      {!safeDisplayContent && !safeDisplayContent?.trim() && message.attachedFile && (
        <div className="text-gray-500 text-sm italic">
          {message.attachedFile.type === 'image' ? 'Image attached' : 'File attached'}
        </div>
      )}
      


      {/* Agent Mode Content */}
      {message.type && (
        <div className="mt-4">
          <div className="content">
            {renderFormattedContent(ensureStringContent(message.content), message.sender)}
          </div>
        </div>
      )}
    </div>
  )
} 