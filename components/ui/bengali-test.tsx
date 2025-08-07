"use client"

import { containsBengali, getFontClass } from '@/lib/bengali-utils'

export default function BengaliTest() {
  const bengaliText = "আমি বাংলায় কথা বলছি" // "I am speaking in Bengali"
  const englishText = "This is English text"
  
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Bengali Font Test</h3>
      
      <div>
        <p className="text-sm text-gray-600 mb-2">Bengali Text (should use ANEK BANGLA):</p>
        <p className={`text-base ${getFontClass(bengaliText)}`}>
          {bengaliText}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Contains Bengali: {containsBengali(bengaliText) ? 'Yes' : 'No'}
        </p>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-2">English Text (should use default font):</p>
        <p className={`text-base ${getFontClass(englishText)}`}>
          {englishText}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Contains Bengali: {containsBengali(englishText) ? 'Yes' : 'No'}
        </p>
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-2">Mixed Text:</p>
        <p className={`text-base ${getFontClass("Hello আপনা")}`}>
          Hello আপনা
        </p>
      </div>
    </div>
  )
} 