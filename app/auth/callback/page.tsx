'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Add a small delay to ensure auth state is properly set
        await new Promise(resolve => setTimeout(resolve, 100))

        // Get the current URL to determine if we're in production or development
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''

        // Redirect to dashboard after auth is complete
        // Use relative path to ensure it works in both dev and production
        router.push('/dashboard')

        console.log('OAuth callback completed, redirecting to dashboard from:', currentOrigin)
      } catch (error) {
        console.error('Error in auth callback:', error)
        // Fallback redirect
        router.push('/dashboard')
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
