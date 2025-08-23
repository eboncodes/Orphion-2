"use client"

import React from 'react'
import MonacoEditor from './MonacoEditor'
// import { formatText } from './KaTeXRenderer' // No longer needed after refactoring

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
  
  return { codeBlocks, textParts };
}

// Removed renderContentWithCodeBlocks and renderMixedContent as react-markdown will handle code block rendering directly. 