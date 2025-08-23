"use client"

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface SignUpModalProps {
  onClose: () => void
  onSwitchToSignIn: () => void
}

export default function SignUpModal({ onClose, onSwitchToSignIn }: SignUpModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await signUp(email, password, name)
      // Don't close the modal here - the AuthContext will handle showing the email verification modal
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-900">Sign Up</h2>
           <button
             onClick={onClose}
             className="text-gray-400 hover:text-gray-600 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
         </div>

         {error && (
           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
             <p className="text-red-600 text-sm">{error}</p>
           </div>
         )}

         <form onSubmit={handleSubmit} className="space-y-3">
                     <div>
             <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
               Full Name
             </label>
             <input
               type="text"
               id="name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
               placeholder="Enter your full name"
               required
             />
           </div>

           <div>
             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
               Email
             </label>
             <input
               type="email"
               id="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
               placeholder="Enter your email"
               required
             />
           </div>

           <div>
             <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
               Password
             </label>
             <input
               type="password"
               id="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
               placeholder="Enter your password"
               required
             />
           </div>

           <div>
             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
               Confirm Password
             </label>
             <input
               type="password"
               id="confirmPassword"
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
               placeholder="Confirm your password"
               required
             />
           </div>

                     <Button
             type="submit"
             disabled={isLoading || !name || !email || !password || !confirmPassword}
             className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-medium transition-colors shadow-sm"
           >
             {isLoading ? 'Creating Account...' : 'Sign Up'}
           </Button>
         </form>

         {/* Divider */}
         <div className="relative my-4">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-gray-200"></div>
           </div>
           <div className="relative flex justify-center text-sm">
             <span className="px-2 bg-white text-gray-500">or</span>
           </div>
         </div>

         {/* Google Sign Up Button */}
         <button
           type="button"
           onClick={handleGoogleSignIn}
           disabled={isLoading}
           className={`w-full flex items-center justify-center space-x-3 px-3 py-2 border border-gray-200 rounded-lg bg-white transition-all duration-300 ease-in-out shadow-sm ${
             isLoading 
               ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-100' 
               : 'hover:bg-gray-50 hover:border-gray-300 hover:shadow-md active:bg-gray-100 active:scale-[0.98]'
           }`}
         >
           {isLoading ? (
             <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
           ) : (
             <svg className="w-5 h-5" viewBox="0 0 24 24">
               <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
               <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
               <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
               <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
             </svg>
           )}
           <span className={`font-medium transition-colors duration-300 ${
             isLoading ? 'text-gray-500' : 'text-gray-700'
           }`}>
             {isLoading ? 'Signing In...' : 'Continue with Google'}
           </span>
         </button>

         <div className="mt-4 text-center">
           <p className="text-gray-600">
             Already have an account?{' '}
             <button
               onClick={onSwitchToSignIn}
               className="text-gray-700 hover:text-gray-900 font-medium underline"
             >
               Sign In
             </button>
           </p>
         </div>
      </div>
      
      
    </div>
  )
}
