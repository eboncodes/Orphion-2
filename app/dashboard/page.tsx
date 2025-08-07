"use client"

import { useState, useCallback, useEffect } from "react"

import { PanelLeftOpen } from "lucide-react"
import Tooltip from "@/components/ui/tooltip"
import Sidebar from "@/components/dashboard/Sidebar"
import MessageBox from "@/components/dashboard/MessageBox"
import Canvas from "@/components/dashboard/Canvas"
import Settings from "@/components/dashboard/Settings"
import { ChatConversation } from "@/lib/chat-storage"

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarDocked, setSidebarDocked] = useState(false)
  const [hasConversation, setHasConversation] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [canvasMessageId, setCanvasMessageId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

  // Handle URL parameters for loading conversations
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation')
    
    if (conversationId) {
      // Import the getConversation function
      import('@/lib/chat-storage').then(({ getConversation }) => {
        const conversation = getConversation(conversationId)
        if (conversation) {
          console.log('Dashboard: Loading conversation from URL:', conversationId)
          setMessages(conversation.messages)
          setCurrentConversationId(conversation.id)
          setHasConversation(true)
          setChatKey(prev => prev + 1)
        } else {
          console.log('Dashboard: Conversation not found:', conversationId)
          // Clear the URL parameter if conversation doesn't exist
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('conversation')
          window.history.replaceState({}, '', newUrl.toString())
        }
      })
    }
  }, [])

  const handleMessagesUpdate = useCallback((newMessages: any[]) => {
    setMessages(newMessages)
  }, [])

  const handleNewChat = () => {
    console.log('Dashboard: Creating new chat')
    // Reset conversation state
    setHasConversation(false)
    setCurrentConversationId(null)
    setMessages([])
    
    // Force re-render of MessageBox with fresh state
    setChatKey(prev => prev + 1)
  }

  const handleLoadConversation = (conversation: ChatConversation) => {
    setMessages(conversation.messages)
    setCurrentConversationId(conversation.id)
    setHasConversation(true)
    // Force re-render of MessageBox with new conversation
    setChatKey(prev => prev + 1)
  }

  const handleSettings = () => {
    setShowSettings(true)
  }

  const handleSidebarHover = () => {
    // Only cancel timeout if sidebar is not docked
    if (!sidebarDocked && closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  }

  const handleToggleDock = () => {
    setSidebarDocked(!sidebarDocked);
    if (!sidebarDocked) {
      // When docking, clear any existing timeout
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        setCloseTimeout(null);
      }
    }
  }

  const getMessageContent = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId)
    if (message && message.sender === 'ai') {
      // Extract display content (without thinking content) for Canvas editing
      const extractThinkingContent = (content: string) => {
        try {
          const thinkRegex = /<think>([\s\S]*?)<\/think>/gi
          let displayContent = content
          
          // Remove all think tags from display content
          displayContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
          
          // Additional cleanup for any remaining malformed tags
          displayContent = displayContent
            .replace(/<think>/gi, '') // Remove opening tags without closing
            .replace(/<\/think>/gi, '') // Remove closing tags without opening
            .trim()
          
          // Additional safety check: if display content is empty after removing think tags, 
          // provide a fallback
          if (!displayContent) {
            displayContent = 'Response generated based on reasoning.'
          }
          
          return displayContent
        } catch (error) {
          console.error('Error extracting thinking content:', error)
          return content
        }
      }
      
      return extractThinkingContent(message.content)
    }
    return ''
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#f8f8f7' }}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        onNewChat={handleNewChat}
        onSettings={handleSettings}
        onLoadConversation={handleLoadConversation}
        currentConversationId={currentConversationId}
        onMouseEnter={handleSidebarHover}
        isDocked={sidebarDocked}
        onToggleDock={handleToggleDock}
      />
      
      {/* Hover area to auto-open sidebar when sidebar is closed (only when not docked) */}
      {!sidebarOpen && !sidebarDocked && (
        <div 
          className="fixed left-0 top-0 w-4 h-full z-20 cursor-pointer"
          onMouseEnter={() => setSidebarOpen(true)}
          title="Hover to open sidebar"
        />
      )}
      
      {/* Hover area to auto-close sidebar when sidebar is open (only when not docked) */}
      {sidebarOpen && !sidebarDocked && (
        <div 
          className="fixed left-80 top-0 w-full h-full z-20"
          onMouseEnter={(e) => {
            // Clear any existing timeout
            if (closeTimeout) {
              clearTimeout(closeTimeout);
            }
            // Add a delay before closing to make it more user-friendly
            const timeout = setTimeout(() => {
              setSidebarOpen(false);
            }, 200); // 200ms delay
            setCloseTimeout(timeout);
          }}
          onMouseLeave={() => {
            // Clear timeout when mouse leaves the overlay
            if (closeTimeout) {
              clearTimeout(closeTimeout);
              setCloseTimeout(null);
            }
          }}
          title="Move cursor outside to close sidebar"
        />
      )}
      
      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-gray-100 p-2 rounded"
          >
            <PanelLeftOpen className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Dock toggle button when sidebar is open */}
      {sidebarOpen && (
        <div className="absolute top-2 left-4 z-10">
          <Tooltip content={sidebarDocked ? 'Undock' : 'Dock'} position="bottom">
            <button
              onClick={handleToggleDock}
              className={`p-2 rounded transition-colors ${
                sidebarDocked 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <PanelLeftOpen className={`w-5 h-5 ${sidebarDocked ? 'rotate-180' : ''}`} />
            </button>
          </Tooltip>
        </div>
      )}
      
      <div className={`flex-1 ${canvasOpen ? 'mr-[700px]' : ''}`}>
        <MessageBox 
          key={chatKey}
          sidebarOpen={sidebarOpen}
          hasConversation={hasConversation}
          onStartConversation={() => setHasConversation(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onCanvasToggle={(isOpen, messageId) => {
            setCanvasOpen(isOpen)
            setCanvasMessageId(messageId || null)
          }}
          onMessagesUpdate={handleMessagesUpdate}
          onMessageUpdate={(messageId, newContent) => {
            // This will be handled by MessageBox internally
            console.log('Message update requested:', messageId, newContent)
          }}
          currentConversationId={currentConversationId}
        />
      </div>

      {/* Canvas Component */}
      {canvasOpen && (
        <div>
            <Canvas 
              isOpen={canvasOpen}
              onClose={() => setCanvasOpen(false)}
              onSave={(content) => {
                console.log('Canvas content saved:', content)
                // Use the MessageBox's internal message update callback
                const messageUpdateCallback = (window as any).__messageUpdateCallback?.current
                if (messageUpdateCallback && canvasMessageId) {
                  messageUpdateCallback(canvasMessageId, content)
                }
                setCanvasOpen(false)
              }}
              aiMessageContent={canvasMessageId ? getMessageContent(canvasMessageId) : undefined}
              messageId={canvasMessageId || undefined}
              onMessageUpdate={(messageId, newContent) => {
                // Use the MessageBox's internal message update callback
                const messageUpdateCallback = (window as any).__messageUpdateCallback?.current
                if (messageUpdateCallback) {
                  messageUpdateCallback(messageId, newContent)
                }
                setCanvasOpen(false)
              }}
            />
        </div>
      )}

      {/* Settings Component */}
      {showSettings && (
        <div>
          <Settings onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  )
} 