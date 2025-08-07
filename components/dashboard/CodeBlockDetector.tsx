"use client"

import React from 'react'
import MonacoEditor from './MonacoEditor'
import { formatText } from './KaTeXRenderer'

interface CodeBlock {
  code: string
  language: string
  startIndex: number
  endIndex: number
}

interface CodeBlockDetectorProps {
  content: string
  sender: 'user' | 'ai'
}

export function detectCodeBlocks(content: string): { codeBlocks: CodeBlock[], textParts: string[] } {
  const codeBlocks: CodeBlock[] = []
  const textParts: string[] = []
  
  // Single comprehensive regex pattern to match all code block formats
  // This prevents duplicate matches that were causing multiple editors
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  
  let lastIndex = 0
  let match
  
  // Find all code blocks
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
      endIndex
    })
    
    lastIndex = endIndex
  }
  
  // Add remaining text after the last code block
  if (lastIndex < content.length) {
    textParts.push(content.slice(lastIndex))
  }
  
  return { codeBlocks, textParts }
}

export function renderContentWithCodeBlocks(content: string, sender: 'user' | 'ai') {
  const { codeBlocks, textParts } = detectCodeBlocks(content)
  
  if (codeBlocks.length === 0) {
    // No code blocks found, return the content as is
    return <span>{content}</span>
  }
  
  const elements: React.ReactNode[] = []
  
  // Render text and code blocks in the correct order
  // We should have textParts.length = codeBlocks.length + 1 (text before, between, and after code blocks)
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
        </div>
      )
    }
  }
  
  return <>{elements}</>
}

// Alternative function that preserves the original formatting for non-code parts
export function renderMixedContent(content: string, sender: 'user' | 'ai') {
  const { codeBlocks, textParts } = detectCodeBlocks(content)
  
  if (codeBlocks.length === 0) {
    // No code blocks found, return the content as is
    return <span>{content}</span>
  }
  
  const elements: React.ReactNode[] = []
  
  // Render text and code blocks in the correct order
  // We should have textParts.length = codeBlocks.length + 1 (text before, between, and after code blocks)
  for (let i = 0; i < textParts.length; i++) {
    // Add text part with formatting preserved
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
        </div>
      )
    }
  }
  
  return <>{elements}</>
} 