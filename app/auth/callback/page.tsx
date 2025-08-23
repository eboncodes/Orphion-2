'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== OAUTH CALLBACK DEBUG ===')
        console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
        console.log('Current Origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A')
        console.log('Search params:', typeof window !== 'undefined' ? window.location.search : 'N/A')

        // Add a small delay to ensure auth state is properly set
        await new Promise(resolve => setTimeout(resolve, 100))

        // Force redirect to production dashboard
        const productionUrl = 'https://orphion-2.vercel.app/dashboard'
        console.log('Redirecting to:', productionUrl)

        window.location.href = productionUrl

      } catch (error) {
        console.error('Error in auth callback:', error)
        // Force redirect even on error
        window.location.href = 'https://orphion-2.vercel.app/dashboard'
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
