"use client"

import React, { useState, useRef, useEffect } from 'react'
import { X, Play, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CodeRunnerProps {
  code: string
  language: string
  isOpen: boolean
  onClose: () => void
}

export default function CodeRunner({ code, language, isOpen, onClose }: CodeRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pythonOutput, setPythonOutput] = useState<string>('')
  const [pyodide, setPyodide] = useState<any>(null)
  const [isPyodideLoading, setIsPyodideLoading] = useState(false)

  // Load Pyodide for Python execution
  useEffect(() => {
    if (language === 'python' && !pyodide && !isPyodideLoading) {
      setIsPyodideLoading(true)
      
      // Load Pyodide from CDN with proper error handling
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
      script.async = true
      
      script.onload = async () => {
        try {
          // Wait a bit for Pyodide to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check if loadPyodide is available
          if (typeof window !== 'undefined' && (window as any).loadPyodide) {
            // @ts-ignore - Pyodide is loaded globally
            const pyodideInstance = await (window as any).loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
            })
            setPyodide(pyodideInstance)
          } else {
            throw new Error('Pyodide not properly loaded')
          }
        } catch (err) {
          console.error('Failed to load Pyodide:', err)
          setError('Failed to load Python runtime. Please try again.')
        } finally {
          setIsPyodideLoading(false)
        }
      }
      
      script.onerror = () => {
        setError('Failed to load Python runtime')
        setIsPyodideLoading(false)
      }
      
      document.head.appendChild(script)
    }
  }, [language, pyodide, isPyodideLoading])

  // Execute Python code
  const executePython = async (code: string) => {
    if (!pyodide) {
      setError('Python runtime not loaded')
      return
    }

    try {
      setIsRunning(true)
      setError(null)
      setPythonOutput('')

      // Set up output capture
      pyodide.runPython(`
import sys
import io
from contextlib import redirect_stdout

# Create a string buffer to capture output
output_buffer = io.StringIO()
sys.stdout = output_buffer
`)

      // Execute the user's code
      try {
        await pyodide.runPythonAsync(`
try:
    exec("""${code.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/"/g, '\\"')}""")
except Exception as e:
    print(f"Error: {e}")
finally:
    # Get the captured output
    captured_output = output_buffer.getvalue()
    output_buffer.close()
    sys.stdout = sys.__stdout__
`)

        // Get the captured output
        const output = pyodide.runPython('captured_output')
        setPythonOutput(output || 'Code executed successfully (no output)')

      } catch (execError) {
        // If the execution fails, try to get any error output
        try {
          const errorOutput = pyodide.runPython('captured_output if "captured_output" in globals() else "Execution failed"')
          setPythonOutput(errorOutput || 'Code execution failed')
        } catch {
          setPythonOutput('Code execution failed')
        }
      }

    } catch (err) {
      console.error('Python execution error:', err)
      setError(err instanceof Error ? err.message : 'Failed to execute Python code')
    } finally {
      setIsRunning(false)
    }
  }

  // Generate HTML content based on language
  const generateHTMLContent = (code: string, language: string): string => {
    if (language === 'html') {
      // For HTML, return the code as-is
      return code
    } else if (language === 'css') {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS Preview</title>
    <style>
        ${code}
    </style>
</head>
<body>
    <div class="demo-content">
        <h1>CSS Preview</h1>
        <p>This is a preview of your CSS styles.</p>
        <button class="btn">Sample Button</button>
        <div class="card">
            <h2>Sample Card</h2>
            <p>This card demonstrates your CSS styling.</p>
        </div>
    </div>
</body>
</html>`
    } else if (language === 'javascript') {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .output { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .error { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <h1>JavaScript Output</h1>
    <div id="output" class="output">Running JavaScript...</div>
    <script>
        try {
            const output = document.getElementById('output');
            ${code}
        } catch (error) {
            document.getElementById('output').innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        }
    </script>
</body>
</html>`
    } else {
      // For other languages, show as formatted text
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Preview</title>
    <style>
        body { font-family: 'Courier New', monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
        pre { background: #2d2d2d; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .language-tag { background: #007acc; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-bottom: 10px; display: inline-block; }
    </style>
</head>
<body>
    <div class="language-tag">${language}</div>
    <pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
</body>
</html>`
    }
  }

  const runCode = async () => {
    if (language === 'python') {
      await executePython(code)
    } else {
      if (!iframeRef.current) return

      setIsRunning(true)
      setError(null)

      try {
        const htmlContent = generateHTMLContent(code, language)
        const iframe = iframeRef.current
        
        // Create a blob URL for the HTML content
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        
        iframe.src = url
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run code')
      } finally {
        setIsRunning(false)
      }
    }
  }

  const openInNewTab = () => {
    try {
      const htmlContent = generateHTMLContent(code, language)
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      window.open(url, '_blank')
      
      // Clean up the blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open in new tab')
    }
  }

  // Auto-run when popup opens for HTML
  useEffect(() => {
    if (isOpen && language === 'html') {
      setTimeout(runCode, 100)
    }
  }, [isOpen, language, code])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl flex flex-col animate-in zoom-in-95 duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">Code Runner</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {language.toUpperCase()}
            </span>
            {language === 'python' && isPyodideLoading && (
              <span className="text-xs text-blue-500">Loading Python runtime...</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runCode}
              disabled={isRunning || (language === 'python' && isPyodideLoading)}
              className="flex items-center space-x-1"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            
            {language !== 'python' && (
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                className="flex items-center space-x-1"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Python Output Display */}
        {language === 'python' && pythonOutput && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM3.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 00-1.414-1.414L11 14.586l-3.293-3.293a1 1 0 00-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Python Output</h3>
                <pre className="text-sm text-green-700 mt-1 bg-green-100 p-2 rounded overflow-x-auto">
                  {pythonOutput}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 p-4">
          <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden">
            {language === 'python' ? (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🐍</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Python Code Runner</h3>
                  <p className="text-gray-500 mb-4">Click "Run" to execute your Python code</p>
                  <div className="bg-white p-4 rounded-lg border max-w-2xl mx-auto">
                    <pre className="text-sm text-gray-800 overflow-x-auto">
                      {code}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Code Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 