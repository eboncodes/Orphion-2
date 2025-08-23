"use client"

import React from "react"

interface ConversationInfoProps {
  isOpen: boolean
  onClose: () => void
  messages: any[]
}

export default function ConversationInfo({ isOpen, onClose, messages }: ConversationInfoProps) {
  if (!isOpen) return null

  // Calculate conversation statistics
  const getConversationStats = () => {
    const userMessages = messages.filter(msg => msg.sender === 'user').length
    const aiMessages = messages.filter(msg => msg.sender === 'ai').length

    return {
      userMessages,
      aiMessages,
      totalMessages: messages.length
    }
  }

  const stats = getConversationStats()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Conversation Info</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-200">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-600">User messages</span>
              <span className="text-sm font-medium text-gray-900">{stats.userMessages}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-600">AI messages</span>
              <span className="text-sm font-medium text-gray-900">{stats.aiMessages}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-600">Total messages</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalMessages}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Statistics update in real-time
        </div>
      </div>
    </div>
  )
}
