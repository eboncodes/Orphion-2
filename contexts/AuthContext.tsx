"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, type User } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  showSignInModal: boolean
  showSignUpModal: boolean
  showEmailVerificationModal: boolean
  verificationEmail: string
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  setShowSignInModal: (show: boolean) => void
  setShowSignUpModal: (show: boolean) => void
  setShowEmailVerificationModal: (show: boolean) => void
  setVerificationEmail: (email: string) => void
  resetLoadingState: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const router = useRouter()
  const isInitialized = useRef(false)
  const authStateListenerRef = useRef<any>(null)

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return
    isInitialized.current = true

    // Check for existing session on mount
    const checkUser = async () => {
      try {
        console.log('AuthContext: Checking for existing user session...')
        const currentUser = await AuthService.getCurrentUser()
        console.log('AuthContext: User session check result:', currentUser ? 'User found' : 'No user')
        setUser(currentUser)
      } catch (error) {
        console.error('AuthContext: Error checking user session:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    // Set up auth state listener with better error handling
    console.log('AuthContext: Setting up auth state listener...')
    try {
      const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
        console.log('AuthContext: Auth state changed:', user ? 'User signed in' : 'User signed out')
        setUser(user)
        setIsLoading(false)
      })
      
      authStateListenerRef.current = subscription
    } catch (error) {
      console.error('AuthContext: Error setting up auth state listener:', error)
      setIsLoading(false)
    }

    return () => {
      console.log('AuthContext: Cleaning up auth state listener...')
      if (authStateListenerRef.current) {
        try {
          authStateListenerRef.current.unsubscribe()
        } catch (error) {
          console.error('AuthContext: Error cleaning up auth state listener:', error)
        }
      }
    }
  }, [])

  // Removed the problematic timeout that was forcing page reloads

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const user = await AuthService.signIn(email, password)
      setUser(user)
      setShowSignInModal(false)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true)
      const result = await AuthService.signUp(email, password, name)
      
      if (result.needsEmailVerification) {
        // Show email verification modal instead of signing in
        setVerificationEmail(email)
        setShowEmailVerificationModal(true)
        setShowSignUpModal(false)
      } else {
        // User is already verified, sign them in
        setUser(result.user)
        setShowSignUpModal(false)
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true)
      await AuthService.signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      
      // Add a safety timeout to prevent loading state from getting stuck
      const safetyTimeout = setTimeout(() => {
        console.warn('Sign out taking too long, forcing cleanup...')
        setUser(null)
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = '/dashboard'
      }, 5000) // 5 second timeout
      
      // Wrap the signOut call with a timeout to prevent hanging
      const signOutPromise = AuthService.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      
      // Clear the safety timeout since sign out completed successfully
      clearTimeout(safetyTimeout)
      
      setUser(null)
      
      // Clear any local storage or cached data
      localStorage.clear()
      sessionStorage.clear()
      
      // Small delay to ensure state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Force a page reload to clear any cached states and ensure clean state
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, clear the local state
      setUser(null)
      localStorage.clear()
      sessionStorage.clear()
      
      // Small delay to ensure state is updated before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect to dashboard even on error
      window.location.href = '/dashboard'
    }
    // Note: We don't need finally block since we're redirecting anyway
    // The loading state will be reset when the new page loads
  }

  // Cleanup function to reset loading state if needed
  const resetLoadingState = () => {
    setIsLoading(false)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    showSignInModal,
    showSignUpModal,
    showEmailVerificationModal,
    verificationEmail,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    setShowSignInModal,
    setShowSignUpModal,
    setShowEmailVerificationModal,
    setVerificationEmail,
    resetLoadingState
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
