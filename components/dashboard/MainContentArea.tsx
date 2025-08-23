"use client"

import { ReactNode, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

interface MainContentAreaProps {
  sidebarOpen: boolean
  sidebarDocked: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  children: ReactNode
}

export default function MainContentArea({
  sidebarOpen,
  sidebarDocked,
  onMouseEnter,
  onMouseLeave,
  children
}: MainContentAreaProps) {
  const pathname = usePathname()
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300) // Match duration-300
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className={`flex-1 flex flex-col transition-opacity duration-300 h-full ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Hover area to auto-open sidebar when closed */}
      {!sidebarOpen && !sidebarDocked && (
        <div 
          className="fixed left-0 top-0 w-3 h-full z-5 cursor-pointer group hover:w-4 transition-all duration-200 hover:bg-gray-50/30"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          title="Hover to open sidebar"
        >
          {/* Visual indicator */}
          <div className="absolute left-0.5 top-1/2 transform -translate-y-1/2 w-1.5 h-12 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      )}
      {children}
    </div>
  )
} 