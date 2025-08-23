import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Robust unique id generator for messages/events
export function generateUniqueId(prefix: string = 'msg'): string {
  // Prefer crypto.randomUUID when available
  const uuid = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? (crypto as any).randomUUID()
    : undefined
  if (uuid) return `${prefix}_${uuid}`

  // Fallback: time + randomized entropy to avoid collisions in fast sequences
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  const extra = (typeof performance !== 'undefined' && performance.now)
    ? Math.floor(performance.now() * 1000).toString(36)
    : ''
  return `${prefix}_${time}_${rand}_${extra}`
}
