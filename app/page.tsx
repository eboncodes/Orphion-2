"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard as the main page
    router.push('/dashboard')
  }, [router])

  // Return null to avoid showing any loading state
  return null
}
