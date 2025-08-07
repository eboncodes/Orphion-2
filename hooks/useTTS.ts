import { useState, useEffect } from 'react'

interface UseTTSReturn {
  speechSynthesis: SpeechSynthesis | null
  currentUtterance: SpeechSynthesisUtterance | null
  currentTTSMessageId: string | null
  handleVoiceMessage: (messageId: string, content: string) => void
  stopTTS: () => void
}

export function useTTS(): UseTTSReturn {
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [currentTTSMessageId, setCurrentTTSMessageId] = useState<string | null>(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis)
    }
  }, [])

  // Cleanup TTS when component unmounts or tab closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUtterance && speechSynthesis) {
        speechSynthesis.cancel()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (currentUtterance && speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [currentUtterance, speechSynthesis])

  const handleVoiceMessage = (messageId: string, content: string) => {
    if (!speechSynthesis) return

    // Stop any currently playing TTS
    if (currentUtterance) {
      speechSynthesis.cancel()
    }

    // If clicking the same message that's playing, stop it
    if (currentTTSMessageId === messageId) {
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
      return
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    // Set up event handlers
    utterance.onstart = () => {
      setCurrentTTSMessageId(messageId)
      setCurrentUtterance(utterance)
    }

    utterance.onend = () => {
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
    }

    utterance.onerror = () => {
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
    }

    // Start speaking
    speechSynthesis.speak(utterance)
  }

  const stopTTS = () => {
    if (currentUtterance && speechSynthesis) {
      speechSynthesis.cancel()
      setCurrentTTSMessageId(null)
      setCurrentUtterance(null)
    }
  }

  return {
    speechSynthesis,
    currentUtterance,
    currentTTSMessageId,
    handleVoiceMessage,
    stopTTS
  }
} 