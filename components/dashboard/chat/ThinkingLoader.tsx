"use client"

import React from 'react'

import { Loader2 } from 'lucide-react'
interface ThinkingLoaderProps {
  className?: string
}

export default function ThinkingLoader({ className = "" }: ThinkingLoaderProps) {
  return (
    <div className={`flex items-center space-x-2 text-gray-600 ${className}`}>
      <span className="text-sm font-medium">Orphion is thinking</span>
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  )
}
