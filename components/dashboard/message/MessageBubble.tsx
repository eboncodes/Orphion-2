"use client"

import React from "react"
import { MessageBubble as ModularMessageBubble } from '../message-bubble'
import { MessageBubbleProps } from '../message-bubble/types'

// Re-export the modular MessageBubble for backward compatibility
export default function MessageBubble(props: MessageBubbleProps) {
  return <ModularMessageBubble {...props} />
} 