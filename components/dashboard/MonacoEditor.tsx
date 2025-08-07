"use client"

import { useRef, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Copy, Download, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CodeRunner from './CodeRunner'

interface MonacoEditorProps {
  code: string
  language?: string
  height?: string
  readOnly?: boolean
  showActions?: boolean
  onCopy?: () => void
  onDownload?: () => void
  onRun?: () => void
}

export default function MonacoEditor({
  code,
  language = 'javascript',
  height = '300px',
  readOnly = true,
  showActions = true,
  onCopy,
  onDownload,
  onRun
}: MonacoEditorProps) {
  const [copied, setCopied] = useState(false)
  const [isEditorLoaded, setIsEditorLoaded] = useState(false)
  const [isCodeRunnerOpen, setIsCodeRunnerOpen] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const editorRef = useRef<any>(null)

  // Suppress Monaco Editor console errors
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Filter out Monaco Editor loading errors
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('Loading "stackframe" failed') || 
           args[0].includes('Loading "error-stack-parser" failed') ||
           args[0].includes('Here are the modules that depend on it'))) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Auto-detect language from code content or file extension
  const detectLanguage = (code: string, defaultLang: string): string => {
    // Check for HTML patterns first (most specific)
    if (code.includes('<!DOCTYPE') || code.includes('<html') || 
        (code.includes('<head>') && code.includes('<body>'))) {
      return 'html'
    }
    
    // Check for CSS patterns (more specific)
    if (code.includes('{') && code.includes('}') && 
        (code.includes('color:') || code.includes('background:') || code.includes('margin:') || 
         code.includes('padding:') || code.includes('font-size:') || code.includes('display:')) &&
        !code.includes('<') && !code.includes('>')) {
      return 'css'
    }
    
    // Check for JavaScript patterns
    if (code.includes('function') && (code.includes('const') || code.includes('let') || code.includes('var'))) {
      return 'javascript'
    }
    
    // Check for TypeScript patterns
    if (code.includes('import') && code.includes('from') && code.includes('export')) {
      return 'typescript'
    }
    
    // Check for Python patterns
    if (code.includes('def ') && code.includes('import ')) {
      return 'python'
    }
    
    // Check for Java patterns
    if (code.includes('public class') || code.includes('private ') || code.includes('public ')) {
      return 'java'
    }
    
    // Check for PHP patterns
    if (code.includes('<?php') || code.includes('$')) {
      return 'php'
    }
    
    // Check for SQL patterns
    if (code.includes('SELECT') || code.includes('INSERT') || code.includes('CREATE TABLE')) {
      return 'sql'
    }
    
    // Check for Go patterns
    if (code.includes('package ') && code.includes('import ')) {
      return 'go'
    }
    
    // Check for Rust patterns
    if (code.includes('fn ') && code.includes('let ')) {
      return 'rust'
    }
    
    return defaultLang
  }

  const detectedLanguage = detectLanguage(code, language)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownload = () => {
    const extension = getFileExtension(detectedLanguage)
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onDownload?.()
  }

  const getFileExtension = (lang: string): string => {
    const extensions: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      php: 'php',
      html: 'html',
      css: 'css',
      sql: 'sql',
      go: 'go',
      rust: 'rs',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      r: 'r',
      matlab: 'm',
      julia: 'jl',
      dart: 'dart',
      elixir: 'ex',
      clojure: 'clj',
      haskell: 'hs',
      fsharp: 'fs',
      ocaml: 'ml',
      lua: 'lua',
      perl: 'pl',
      bash: 'sh',
      powershell: 'ps1',
      yaml: 'yml',
      json: 'json',
      xml: 'xml',
      markdown: 'md',
      dockerfile: 'Dockerfile',
      shell: 'sh'
    }
    return extensions[lang] || 'txt'
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    setIsEditorLoaded(true)
  }

  const handleEditorWillMount = (monaco: any) => {
    // Configure Monaco Editor to handle loading errors gracefully
    monaco.editor.onDidCreateEditor(() => {
      // Suppress console errors for missing modules
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        // Filter out Monaco Editor loading errors
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('Loading "stackframe" failed') || 
             args[0].includes('Loading "error-stack-parser" failed') ||
             args[0].includes('Here are the modules that depend on it'))) {
          return;
        }
        originalConsoleError.apply(console, args);
      };
    });
  }

  const handleEditorValidation = (markers: any[]) => {
    // Monaco editor validation
  }

  const handleRunCode = () => {
    setIsCodeRunnerOpen(true)
    onRun?.()
  }

  // Add error boundary for Monaco Editor
  if (editorError) {
    return (
      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {detectedLanguage}
            </span>
            <span className="text-xs text-gray-400">
              {code.split('\n').length} lines
            </span>
          </div>
        </div>
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Editor Error</h3>
              <p className="text-sm text-red-700 mt-1">{editorError}</p>
              <button 
                onClick={() => setEditorError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with language indicator and actions */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {detectedLanguage}
          </span>
          <span className="text-xs text-gray-400">
            {code.split('\n').length} lines
          </span>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRunCode}
              className="h-7 px-2 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Run
            </Button>
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="relative">
        <Editor
          height={height}
          language={detectedLanguage}
          value={code}
          theme="vs-light"
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            lineNumbers: 'on',
            roundedSelection: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
              useShadows: true
            },
            automaticLayout: true,
            wordWrap: 'on',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            contextmenu: true,
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: false,
            parameterHints: {
              enabled: false
            },
            suggest: {
              showKeywords: false,
              showSnippets: false,
              showClasses: false,
              showFunctions: false,
              showVariables: false,
              showConstants: false,
              showEnums: false,
              showModules: false,
              showProperties: false,
              showEvents: false,
              showOperators: false,
              showUnits: false,
              showValues: false,
              showColors: false,
              showFiles: false,
              showReferences: false,
              showFolders: false,
              showTypeParameters: false,
              showWords: false,
              showUsers: false,
              showIssues: false
            },
            padding: {
              top: 16,
              bottom: 16
            },
            lineHeight: 22,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            mouseWheelScrollSensitivity: 1.2
          }}
          onMount={handleEditorDidMount}
          beforeMount={handleEditorWillMount}
          onValidate={handleEditorValidation}
          loading={<div className="p-4 text-center text-gray-500">Loading editor...</div>}
        />
      </div>
      
      {/* Code Runner Popup */}
      <CodeRunner
        code={code}
        language={detectedLanguage}
        isOpen={isCodeRunnerOpen}
        onClose={() => setIsCodeRunnerOpen(false)}
      />
    </div>
  )
} 