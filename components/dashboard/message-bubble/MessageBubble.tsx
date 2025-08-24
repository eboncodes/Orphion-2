"use client"

import React from "react"
import SearchSources from '../ui/SearchSources'
import { containsBengali, getFontClass } from '@/lib/bengali-utils'
import { renderFormattedContent } from '../utils/KaTeXRenderer'
import { MessageBubbleProps } from './types'
import { useMessageBubble } from './hooks/useMessageBubble'
import AttachedFile from './components/AttachedFile'
import FadeInImage from './components/FadeInImage'
import MessageContent from './components/MessageContent'
// SearchResults now renders under the SearchRequestPill inside MessageContent
import PageContentPill from '../../pages/PageContentPill'
import ThinkingLoader from '../chat/ThinkingLoader'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'

export default function MessageBubble({
  message,
  isLoading = false,
  onLikeMessage,
  onDislikeMessage,
  onRegenerateMessage,
  onPageCreated,
}: MessageBubbleProps) {
  const { user } = useAuth()
  
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

  const {
    isThinkingOpen,
    setIsThinkingOpen,
    isModalOpen,
    extractThinkingContent,
    handleImagePopupClose,
    openImagePopup
  } = useMessageBubble()

  const { thinkingContent, displayContent } = extractThinkingContent(message.content, message.sender)

  // Debug logging for message content
  console.log('MessageBubble received message:', {
    id: message.id,
    sender: message.sender,
    content: message.content,
    contentType: typeof message.content,
    displayContent,
    displayContentType: typeof displayContent
  })



  // Handle page-content message type
  if (message.type === 'page-content') {
    return (
      <div className="mb-6 group text-left">
        <div className="inline-block max-w-[85%] mr-auto">
          <PageContentPill
            content={message.content}
            timestamp={message.timestamp}
          />

        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`mb-6 group ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
        {/* Message Container */}
        <div className={`inline-block max-w-[85%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
          {/* Attached file component */}
          {/* Only show attachedFile for user uploads, not for generated images */}
          {message.sender === 'user' && (
            <AttachedFile 
              attachedFile={message.attachedFile}
              isUserMessage={true}
            />
          )}

          {/* Message content with rounded background for user messages */}
          <div className={`text-base ${getFontClass(displayContent)} ${
            message.sender === 'user'
              ? 'text-gray-900 bg-[#ebebeb] text-gray-900 px-3 py-1.5 rounded-2xl rounded-br-md shadow-sm relative'
              : 'text-black'
          }`}>
            <div className={message.sender === 'user' ? 'text-left' : ''}>
              {/* AI Thinking Animation */}
              {message.sender === 'ai' && isLoading && (!displayContent || displayContent.trim() === '') && (
                <div className="mb-2">
                  <ThinkingLoader />
                </div>
              )}
              <MessageContent
                message={message}
                displayContent={displayContent}
                isLoading={isLoading}
                onPageCreated={onPageCreated}
                onImageClick={(idx) => openImagePopup(idx)}
              />
            </div>
            
            {/* User Avatar in corner */}
            {message.sender === 'user' && (
              <div className="absolute -bottom-2 -right-2">
                <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                  {user?.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
                  ) : null}
                  <AvatarFallback className={`${user?.email ? getProfileIcon(user.email).color : 'bg-gray-600'} text-white text-xs`}>
                    {user?.email ? getProfileIcon(user.email).letter : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Search results are handled in MessageContent under the search pill */}

      {/* Image popup viewer */}
        </div>

        {/* Timestamp - Only show for AI messages with fade-in effect on hover */}
        {message.sender === 'ai' && (
          <div className="text-xs text-gray-500 mt-2 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>


    </>
  )
} 