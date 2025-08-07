"use client"

import React, { useState, useEffect } from 'react'
import MonacoEditor from './MonacoEditor'
import { formatText } from './KaTeXRenderer'

interface StreamingCodeRendererProps {
  content: string
  sender: 'user' | 'ai'
  isStreaming?: boolean
}

interface CodeBlock {
  code: string
  language: string
  startIndex: number
  endIndex: number
  isComplete: boolean
}

export function detectCodeBlocksInStream(content: string): { codeBlocks: CodeBlock[], textParts: string[] } {
  const codeBlocks: CodeBlock[] = []
  const textParts: string[] = []
  
  // Single comprehensive regex pattern to match all code block formats
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  
  let lastIndex = 0
  let match
  
  // Find all complete code blocks
  while ((match = codeBlockRegex.exec(content)) !== null) {
    let language = match[1] || 'text'
    let code = match[2]
    
    // Auto-detect language if not specified
    if (language === 'text' || !language) {
      if (code.includes('<!DOCTYPE') || code.includes('<html') || 
          (code.includes('<head>') && code.includes('<body>'))) {
        language = 'html'
      } else if (code.includes('{') && code.includes('}') && 
                 (code.includes('color:') || code.includes('background:') || code.includes('margin:') || 
                  code.includes('padding:') || code.includes('font-size:') || code.includes('display:')) &&
                 !code.includes('<') && !code.includes('>')) {
        language = 'css'
      } else if (code.includes('function') && (code.includes('const') || code.includes('let') || code.includes('var'))) {
        language = 'javascript'
      } else if (code.includes('import') && code.includes('from') && code.includes('export')) {
        language = 'typescript'
      }
    }
    
    const startIndex = match.index!
    const endIndex = startIndex + match[0].length
    
    // Add text before the code block
    if (startIndex > lastIndex) {
      textParts.push(content.slice(lastIndex, startIndex))
    }
    
    // Add the code block
    codeBlocks.push({
      code,
      language,
      startIndex,
      endIndex,
      isComplete: true
    })
    
    lastIndex = endIndex
  }
  
  // Check for incomplete code blocks (code blocks that are still being streamed)
  const incompleteCodeBlockRegex = /```(\w+)?\n?([\s\S]*?)$/
  const incompleteMatch = content.match(incompleteCodeBlockRegex)
  
  if (incompleteMatch && !content.endsWith('```')) {
    const language = incompleteMatch[1] || 'text'
    const code = incompleteMatch[2] || ''
    const startIndex = content.lastIndexOf('```')
    
    // Add text before the incomplete code block
    if (startIndex > lastIndex) {
      textParts.push(content.slice(lastIndex, startIndex))
    }
    
    // Add the incomplete code block
    codeBlocks.push({
      code,
      language,
      startIndex,
      endIndex: content.length,
      isComplete: false
    })
  } else {
    // Add remaining text after the last code block
    if (lastIndex < content.length) {
      textParts.push(content.slice(lastIndex))
    }
  }
  
  return { codeBlocks, textParts }
}

export function renderStreamingContentWithCodeBlocks(content: string, sender: 'user' | 'ai', isStreaming: boolean = false) {
  const { codeBlocks, textParts } = detectCodeBlocksInStream(content)
  
  if (codeBlocks.length === 0) {
    // No code blocks found, return the content as is
    return <span>{content}</span>
  }
  
  const elements: React.ReactNode[] = []
  
  // Render text and code blocks in the correct order
  for (let i = 0; i < textParts.length; i++) {
    // Add text part with proper formatting
    if (textParts[i]) {
      elements.push(
        <span key={`text-${i}`}>
          {formatText(textParts[i])}
        </span>
      )
    }
    
    // Add code block (if there is one for this position)
    if (i < codeBlocks.length) {
      const block = codeBlocks[i]
      elements.push(
        <div key={`code-${i}`} className="my-4">
          <MonacoEditor
            code={block.code}
            language={block.language}
            height={`${Math.max(200, Math.min(600, block.code.split('\n').length * 20))}px`}
            readOnly={true}
            showActions={true}
            onCopy={() => console.log('Code copied')}
            onDownload={() => console.log('Code downloaded')}
            onRun={() => console.log('Code run')}
          />
          {!block.isComplete && isStreaming && (
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <div className="animate-pulse mr-2">●</div>
              Streaming code...
            </div>
          )}
        </div>
      )
    }
  }
  
  return <>{elements}</>
}

export default function StreamingCodeRenderer({ content, sender, isStreaming }: StreamingCodeRendererProps) {
  return renderStreamingContentWithCodeBlocks(content, sender, isStreaming)
} 