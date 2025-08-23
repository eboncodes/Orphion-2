import { useState, useEffect } from 'react'
import { Message } from '../types'

export function useMessageBubble() {
  const [isThinkingOpen, setIsThinkingOpen] = useState(false)
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false)
  const [isImagePopupClosing, setIsImagePopupClosing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleImagePopupClose = () => {
    setIsImagePopupClosing(true)
    setTimeout(() => {
      setIsImagePopupOpen(false)
      setIsModalOpen(false)
      setIsImagePopupClosing(false)
      setSelectedImageIndex(0)
    }, 200)
  }

  const openImagePopup = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex)
    setIsImagePopupOpen(true)
  }

  const extractThinkingContent = (content: any, sender: 'user' | 'ai') => {
    // Ensure content is always a string
    let stringContent = '';
    if (typeof content === 'string') {
      stringContent = content;
    } else if (content === null || content === undefined) {
      stringContent = '';
    } else if (typeof content === 'object') {
      // Try to extract meaningful content from object
      stringContent = content.text || content.message || content.content || content.body || JSON.stringify(content);
      // If JSON.stringify gives us [object Object], try to get a better representation
      if (stringContent === '[object Object]') {
        stringContent = `Object: ${Object.keys(content).join(', ')}`;
      }
    } else {
      // For any other type, convert to string
      stringContent = String(content);
    }

    // Since we're no longer using think tags, just return the content as is
    return { thinkingContent: null, displayContent: stringContent }
  }

  return {
    isThinkingOpen,
    setIsThinkingOpen,
    isImagePopupOpen,
    setIsImagePopupOpen,
    isImagePopupClosing,
    isModalOpen,
    selectedImageIndex,
    extractThinkingContent,
    handleImagePopupClose,
    openImagePopup
  }
} 