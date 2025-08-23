"use client"

import { useState } from 'react'
import { X, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthService } from '@/lib/auth-service'

interface EmailVerificationModalProps {
  email: string
  onClose: () => void
}

export default function EmailVerificationModal({ 
  email, 
  onClose
}: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendSuccess(false)
    
    try {
      await AuthService.resendVerificationEmail(email)
      setResendSuccess(true)
    } catch (error) {
      console.error('Failed to resend email:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-gray-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Check your email
          </h3>
          
          <p className="text-gray-600 mb-4">
            We've sent a verification link to:
          </p>
          
          <p className="text-gray-900 font-medium mb-6">
            {email}
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-gray-800 font-medium mb-1">
                  Next steps:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Check your email inbox</li>
                  <li>• Click the verification link</li>
                  <li>• Return here to sign in</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? 'Sending...' : 'Resend verification email'}
          </Button>
          
          {resendSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm text-center">
                Verification email sent successfully!
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already verified?{' '}
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 font-medium underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
