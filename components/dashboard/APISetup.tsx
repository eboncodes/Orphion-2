"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"

interface APISetupProps {
  onComplete: () => void
}

interface APIKey {
  value: string
  isVisible: boolean
}

export default function APISetup({ onComplete }: APISetupProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, APIKey>>({
    gemini: { value: "", isVisible: false }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const updateAPIKey = (service: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: { ...prev[service], value }
    }))
  }

  const toggleVisibility = (service: string) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: { ...prev[service], isVisible: !prev[service].isVisible }
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError("")

    try {
      // Store API keys in localStorage
      Object.entries(apiKeys).forEach(([service, key]) => {
        localStorage.setItem(`${service}_api_key`, key.value)
      })

      // Mark setup as complete
      localStorage.setItem("api_setup_complete", "true")
      
      onComplete()
    } catch (error) {
      setError("Failed to save API keys. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const allKeysFilled = Object.values(apiKeys).every(key => key.value.trim() !== "")

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#e6e6e6' }}
    >
      <div>
        <Card className="w-full max-w-2xl">
          <div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Welcome to Orphion AI</CardTitle>
              <CardDescription>
                To get started, please provide your API keys for the required services.
              </CardDescription>
            </CardHeader>
          </div>
          <CardContent className="space-y-6">
            <React.Fragment>
              {error && (
                <div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </React.Fragment>



          {/* Gemini API Key */}
          <div 
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.6,
              ease: "easeOut"
            }}
          >
            <label className="text-sm font-medium">Gemini API Key</label>
            <div className="relative">
              <Input
                type={apiKeys.gemini.isVisible ? "text" : "password"}
                placeholder="AIza..."
                value={apiKeys.gemini.value}
                onChange={(e) => updateAPIKey("gemini", e.target.value)}
                className="pr-12"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisibility("gemini")}
                >
                  {apiKeys.gemini.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Used for AI chat, document analysis, and image generation. Get your key from{" "}
              <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Google AI Studio
              </a>
            </p>
          </div>

          <div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.8,
              ease: "easeOut"
            }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!allKeysFilled || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="md" className="mr-2" />
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
} 