"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Spinner } from '@/components/ui/spinner'
import APISetup from "@/components/dashboard/APISetup"
import { isAPISetupComplete } from "@/lib/api-keys"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    // Check if API setup is complete
    const setupComplete = isAPISetupComplete()
    
    if (setupComplete) {
      // Redirect immediately without animation
      router.push("/dashboard")
    } else {
      // Show API setup
      setShowSetup(true)
      setIsLoading(false)
    }
  }, [router])

  const handleSetupComplete = () => {
    router.push("/dashboard")
  }

  if (showSetup) {
    return <APISetup onComplete={handleSetupComplete} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#e6e6e6' }}>
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6">
          <Image 
            src="/ophion-icon-black.png" 
            alt="Orphion Logo" 
            width={80} 
            height={80} 
            className="w-20 h-20 mx-auto" 
          />
        </div>

        {/* TEJ Intelligence Text */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          TEJ Intelligence
        </h1>

        {/* Loading Text */}
        <p className="text-gray-600 mb-8">
          Initializing...
        </p>

        {/* Spinner */}
        <div>
          <Spinner size="lg" className="border-blue-600 mx-auto" />
        </div>
      </div>
    </div>
  )
}
