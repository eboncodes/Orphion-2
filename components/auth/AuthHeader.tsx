"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import SignInModal from './SignInModal'
import SignUpModal from './SignUpModal'
import EmailVerificationModal from './EmailVerificationModal'
import { useState, useEffect, useRef } from 'react'
import { LogOut, User } from 'lucide-react'
import NotificationPopup from '@/components/dashboard/ui/NotificationPopup'

interface AuthHeaderProps {
  showNotifications?: boolean
}

export default function AuthHeader({ showNotifications = true }: AuthHeaderProps) {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    signOut, 
    showSignInModal, 
    showSignUpModal, 
    showEmailVerificationModal,
    verificationEmail,
    setShowSignInModal, 
    setShowSignUpModal,
    setShowEmailVerificationModal
  } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotificationPopup, setShowNotificationPopup] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Helper function to generate profile icon based on email
  const getProfileIcon = (email: string) => {
    const firstLetter = email.charAt(0).toUpperCase()
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const colorIndex = email.charCodeAt(0) % colors.length
    return { letter: firstLetter, color: colors[colorIndex] }
  }

  const handleSignInClick = () => {
    setShowSignInModal(true)
  }

  const handleSignUpClick = () => {
    setShowSignUpModal(true)
  }

  const handleSwitchToSignUp = () => {
    setShowSignInModal(false)
    setShowSignUpModal(true)
  }

  const handleSwitchToSignIn = () => {
    setShowSignUpModal(false)
    setShowSignInModal(true)
  }

  const handleCloseSignIn = () => {
    setShowSignInModal(false)
  }

  const handleCloseSignUp = () => {
    setShowSignUpModal(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Cleanup signing out state if component unmounts
  useEffect(() => {
    return () => {
      if (isSigningOut) {
        setIsSigningOut(false)
      }
    }
  }, [isSigningOut])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        {/* Show a simple loading indicator without spinner */}
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Notifications Bell */}
        {showNotifications && (
          <div className="relative mr-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Notifications"
              onClick={() => setShowNotificationPopup(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
          </div>
        )}
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {user ? (
                user.avatar_url ? (
                  // Show Google avatar if available
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img 
                      src={user.avatar_url} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to letter avatar if image fails to load
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    <div className={`w-8 h-8 ${getProfileIcon(user.email).color} rounded-full flex items-center justify-center hidden`}>
                      <span className="text-sm font-semibold text-white">
                        {getProfileIcon(user.email).letter}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Fallback to letter avatar
                  <div className={`w-8 h-8 ${getProfileIcon(user.email).color} rounded-full flex items-center justify-center`}>
                    <span className="text-sm font-semibold text-white">
                      {getProfileIcon(user.email).letter}
                    </span>
                  </div>
                )
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 truncate">
                  {user?.email}
                </div>
                <button
                  onClick={async () => {
                    if (isSigningOut) return // Prevent multiple clicks
                    
                    setShowUserMenu(false)
                    setIsSigningOut(true)
                    console.log('Sign out button clicked')
                    try {
                      console.log('Calling signOut...')
                      await signOut()
                      console.log('Sign out completed successfully')
                    } catch (error) {
                      console.error('Sign out failed:', error)
                      // Force reload if sign out fails to clear any stuck state
                      window.location.reload()
                    } finally {
                      setIsSigningOut(false)
                    }
                  }}
                  disabled={isSigningOut}
                  className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                    isSigningOut 
                      ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isSigningOut ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSignInClick}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUpClick}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNotifications && showNotificationPopup && (
        <NotificationPopup onClose={() => setShowNotificationPopup(false)} />
      )}
      {showSignInModal && (
        <SignInModal
          onClose={handleCloseSignIn}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      )}
      
      {showSignUpModal && (
        <SignUpModal
          onClose={handleCloseSignUp}
          onSwitchToSignIn={handleSwitchToSignIn}
        />
      )}
      
      {showEmailVerificationModal && (
        <EmailVerificationModal
          email={verificationEmail}
          onClose={() => {
            setShowEmailVerificationModal(false)
          }}
        />
      )}
    </>
  )
}
