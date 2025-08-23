"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Paperclip, 
  Camera, 
  Mail, 
  MessageCircle, 
  Mic,
  ChevronDown
} from 'lucide-react'
import { GreetingDisplay } from './GreetingDisplay'
import { ActionButtons } from './ActionButtons'
import { InputControls } from './InputControls'
import { SpeedControl } from './SpeedControl'

interface ChatInterfaceProps {
  userName: string
  greeting: string
  placeholder: string
}

export function ChatInterface({ userName, greeting, placeholder }: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [speed, setSpeed] = useState('balanced')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      // Handle message submission
      console.log('Message:', message)
      setMessage('')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7f6' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Greeting Section */}
          <GreetingDisplay userName={userName} greeting={greeting} />
          
          {/* Main Input Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Field with Controls */}
                <div className="relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={placeholder}
                    className="pr-32 h-12 text-base bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                  />
                  <InputControls />
                </div>
                
                {/* Speed Control and Voice Input */}
                <div className="flex items-center justify-between">
                  <SpeedControl value={speed} onValueChange={setSpeed} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <ActionButtons />
          
          {/* Explore Use Cases */}
          <div className="text-center">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
              Explore use cases
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}