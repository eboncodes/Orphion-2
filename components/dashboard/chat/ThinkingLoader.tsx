"use client"

import React from 'react'

interface ThinkingLoaderProps {
  className?: string
}

export default function ThinkingLoader({ className = "" }: ThinkingLoaderProps) {
  return (
    <div className={`flex items-center space-x-2 text-gray-600 ${className}`}>
      <span className="text-sm font-medium">Orphion is thinking</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  )
}
