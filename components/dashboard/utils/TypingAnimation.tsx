"use client"

import { useEffect, useRef, useState } from 'react'

interface TypingAnimationProps {
  text: string
  speed?: number // ms per character
  showOnce?: boolean
}

export default function TypingAnimation({ text, speed = 50, showOnce = true }: TypingAnimationProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // If we only show once and it's already completed, keep final text
    if (showOnce && done) return

    // Clear any existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Reset text and start typing
    setDisplayed('')
    let i = 0
    let cancelled = false

    const step = () => {
      if (cancelled) return
      // Slice ensures deterministic output and avoids jumbled characters
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i < text.length) {
        timeoutRef.current = setTimeout(step, Math.max(10, speed))
      } else {
        setDone(true)
        timeoutRef.current = null
      }
    }

    // Kick off typing
    timeoutRef.current = setTimeout(step, Math.max(10, speed))

    return () => {
      cancelled = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    // Re-run if source text or speed changes
  }, [text, speed, showOnce])

  return <span>{displayed}</span>
}
