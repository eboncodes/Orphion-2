"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, RefreshCw, Save } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { getAPIKeys, clearAPIKeys } from "@/lib/api-keys"

interface SettingsProps {
  onClose: () => void
}

export default function Settings({ onClose }: SettingsProps) {
  const originalApiKeys = getAPIKeys()
  const [apiKeys, setApiKeys] = useState(originalApiKeys)
  const [visibility, setVisibility] = useState({
    gemini: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [message, setMessage] = useState("")
  const [validationResults, setValidationResults] = useState({
    gemini: null as boolean | null
  })

  const updateAPIKey = (service: keyof typeof apiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: value
    }))
    // Reset validation results when key changes
    setValidationResults(prev => ({
      ...prev,
      [service]: null
    }))
  }

  const toggleVisibility = (service: keyof typeof visibility) => {
    setVisibility(prev => ({
      ...prev,
      [service]: !prev[service]
    }))
  }

  const validateAPIKey = async (service: string, apiKey: string): Promise<boolean> => {
    try {
      console.log(`Validating ${service} API key...`)
      const response = await fetch(`/api/validate/${service}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey })
      })

      console.log(`${service} validation response status:`, response.status)
      console.log(`${service} validation response ok:`, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log(`${service} validation data:`, data)
        return true
      } else {
        const errorText = await response.text()
        console.error(`${service} validation failed:`, response.status, errorText)
        return false
      }
    } catch (error) {
      console.error(`${service} validation error:`, error)
      return false
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage("")
    
    try {
      // Validate all API keys
      const validationPromises = Object.entries(apiKeys).map(async ([service, key]) => {
        if (!key.trim()) return { service, valid: false }
        const isValid = await validateAPIKey(service, key)
        return { service, valid: isValid }
      })

      const results = await Promise.all(validationPromises)
      const validationResultsMap = results.reduce((acc, { service, valid }) => {
        acc[service as keyof typeof validationResults] = valid
        return acc
      }, {} as typeof validationResults)

      setValidationResults(validationResultsMap)

      // Check if all keys are valid
      const allValid = results.every(result => result.valid)
      
      if (allValid) {
        // Save API keys to localStorage
        Object.entries(apiKeys).forEach(([service, key]) => {
          localStorage.setItem(`${service}_api_key`, key)
        })
        setMessage("✅ All API keys validated and saved successfully!")
        
        // Auto close after a brief delay
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        const invalidServices = results.filter(r => !r.valid).map(r => r.service).join(", ")
        setMessage(`❌ Some API keys are invalid: ${invalidServices}. Please check and try again.`)
      }
    } catch (error) {
      setMessage("❌ Failed to validate API keys. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      clearAPIKeys()
      setApiKeys({
        huggingface: "",
        gemini: ""
      })
      setValidationResults({
        huggingface: null,
        gemini: null
      })
      setMessage("API keys have been cleared. You'll need to set them up again.")
    } catch (error) {
      setMessage("Failed to clear API keys.")
    } finally {
      setIsResetting(false)
    }
  }

  // Check if any API key has been modified from original values
  const hasChanges = Object.keys(apiKeys).some(key => 
    apiKeys[key as keyof typeof apiKeys] !== originalApiKeys[key as keyof typeof originalApiKeys]
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Settings
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your API keys and application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}



          {/* Gemini API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gemini API Key</label>
            <div className="relative">
              <Input
                type={visibility.gemini ? "text" : "password"}
                placeholder="AIza..."
                value={apiKeys.gemini}
                onChange={(e) => updateAPIKey("gemini", e.target.value)}
                className="pr-12"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisibility("gemini")}
                >
                  {visibility.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Used for AI chat, document analysis, and image generation
            </p>
            {validationResults.gemini !== null && (
              <div className="flex items-center gap-2">
                {validationResults.gemini ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs">
                  {validationResults.gemini ? "Valid" : "Invalid"}
                </span>
              </div>
            )}
          </div>



          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isResetting}
              className="flex-1"
            >
              {isResetting ? (
                <>
                  <Spinner size="md" className="mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset API Keys
                </>
              )}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Spinner size="md" className="mr-2" />
                  Validating & Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 