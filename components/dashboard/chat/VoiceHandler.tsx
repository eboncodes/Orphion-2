"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useTTS } from '@/hooks/useTTS'
import { useSpeechToText } from '@/hooks/useSpeechToText'

interface VoiceHandlerProps {
  onVoiceInput: (transcript: string) => void
  onError: (error: string) => void
}

export default function VoiceHandler({
  onVoiceInput,
  onError
}: VoiceHandlerProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentTTSMessageId, setCurrentTTSMessageId] = useState<string | null>(null)

  // Custom hooks
  const { handleVoiceMessage, stopTTS } = useTTS()
  const { startListening, stopListening, isListening: sttIsListening, transcript } = useSpeechToText()

  // Handle voice input
  const handleVoiceInput = useCallback((transcript: string) => {
    onVoiceInput(transcript)
  }, [onVoiceInput])

  // Start voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      setIsListening(true)
      startListening()
    } catch (error) {
      console.error('Voice recording error:', error)
      onError('Failed to start voice recording. Please check your microphone permissions.')
      setIsListening(false)
    }
  }, [startListening, onError])

  // Stop voice recording
  const stopVoiceRecording = useCallback(() => {
    try {
      stopListening()
      setIsListening(false)
    } catch (error) {
      console.error('Error stopping voice recording:', error)
    }
  }, [stopListening])

  // Play text-to-speech
  const playTTS = useCallback(async (messageId: string, content: string) => {
    try {
      setIsSpeaking(true)
      setCurrentTTSMessageId(messageId)
      
      handleVoiceMessage(messageId, content)
    } catch (error) {
      console.error('TTS error:', error)
      onError('Failed to play audio. Please try again.')
    } finally {
      setIsSpeaking(false)
      setCurrentTTSMessageId(null)
    }
  }, [handleVoiceMessage, onError])

  // Stop text-to-speech
  const stopTTSPlayback = useCallback(() => {
    try {
      stopTTS()
      setIsSpeaking(false)
      setCurrentTTSMessageId(null)
    } catch (error) {
      console.error('Error stopping TTS:', error)
    }
  }, [stopTTS])

  // Check if microphone is available
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }, [])

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      return true
    } catch (error) {
      console.error('Failed to get microphone permission:', error)
      onError('Microphone permission is required for voice input.')
      return false
    }
  }, [onError])

  // Get voice input status
  const getVoiceInputStatus = useCallback(() => ({
    isListening,
    isSpeaking,
    currentTTSMessageId,
    canUseVoice: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window
  }), [isListening, isSpeaking, currentTTSMessageId])

  // Toggle voice recording
  const toggleVoiceRecording = useCallback(async () => {
    if (isListening) {
      stopVoiceRecording()
    } else {
      const hasPermission = await checkMicrophonePermission()
      if (hasPermission) {
        await startVoiceRecording()
      } else {
        const granted = await requestMicrophonePermission()
        if (granted) {
          await startVoiceRecording()
        }
      }
    }
  }, [isListening, stopVoiceRecording, startVoiceRecording, checkMicrophonePermission, requestMicrophonePermission])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopVoiceRecording()
      }
      if (isSpeaking) {
        stopTTSPlayback()
      }
    }
  }, [isListening, isSpeaking, stopVoiceRecording, stopTTSPlayback])

  return {
    isListening,
    isSpeaking,
    currentTTSMessageId,
    startVoiceRecording,
    stopVoiceRecording,
    playTTS,
    stopTTSPlayback,
    toggleVoiceRecording,
    getVoiceInputStatus,
    checkMicrophonePermission,
    requestMicrophonePermission
  }
} 