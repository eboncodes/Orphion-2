"use client"

import { useState, useRef, useEffect } from "react"
import { generateUniqueId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Paperclip, Sliders, Mic, ArrowUp } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { OrphionAIResponse } from "@/app/services/OrphionAIService"


interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface ChatSystemProps {
  sidebarOpen: boolean
  onSendMessage: (message: string) => Promise<OrphionAIResponse>
}

export default function ChatSystem({ sidebarOpen, onSendMessage }: ChatSystemProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 144 // Maximum height for 5-6 lines
      
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.height = `${maxHeight}px`
        textareaRef.current.style.overflowY = "auto"
      } else {
        textareaRef.current.style.height = `${scrollHeight}px`
        textareaRef.current.style.overflowY = "hidden"
      }
    }
  }, [inputMessage])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Auto-focus the textarea when messages change
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [messages])
  
  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [])

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('Messages updated:', messages)
  }, [messages])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    console.log('Sending message:', inputMessage.trim())

    const userMessage: Message = {
      id: generateUniqueId('user'),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    console.log('Adding user message:', userMessage)
    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      console.log('Updated messages:', newMessages)
      return newMessages
    })
    
    setInputMessage("")
    setIsLoading(true)

    try {
      // Call the OrphionAI engine
      const aiResponse = await onSendMessage(userMessage.content)
      
      // Add the AI response to messages
      const aiMessage: Message = {
        id: generateUniqueId('ai'),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(aiResponse.timestamp)
      }
      console.log('Adding AI message:', aiMessage)
      setMessages(prev => {
        const newMessages = [...prev, aiMessage]
        console.log('Updated messages with AI:', newMessages)
        return newMessages
      })
      setIsLoading(false)
      
      // Focus the textarea after sending a message
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
    }
  }

  const MessageBubble = ({ message }: { message: Message }) => {
    console.log('Rendering message bubble:', message)
    return (
      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              message.sender === 'user'
                ? 'bg-gray-200 text-gray-900'
                : 'bg-white border border-gray-200 shadow-sm text-gray-900'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          

          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input at Bottom */}
              <div className="p-4">
          <div className={`w-full transition-all duration-300 ease-in-out ${sidebarOpen ? "max-w-2xl" : "max-w-3xl"} mx-auto`}>
            <div className="relative bg-transparent rounded-2xl border border-gray-200 p-4 transform transition-all duration-300 ease-in-out">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="w-full border-0 bg-transparent text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none outline-none min-h-[24px] max-h-[144px] leading-6"
              rows={1}
              disabled={isLoading}
            />

            {/* Bottom Icons */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <Paperclip className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
                <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700">
                  <Sliders className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Tools</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
                <Button
                  size="sm"
                  className="rounded-full w-8 h-8 p-0 bg-black hover:bg-gray-800"
                  disabled={!inputMessage.trim() || isLoading}
                  onClick={handleSendMessage}
                >
                  <ArrowUp className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}