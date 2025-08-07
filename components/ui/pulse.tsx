"use client"

interface PulseProps {
  className?: string
  children?: React.ReactNode
}

export function Pulse({ className = "", children }: PulseProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
} 