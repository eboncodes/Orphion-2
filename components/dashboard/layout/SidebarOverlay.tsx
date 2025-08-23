"use client"

interface SidebarOverlayProps {
  sidebarOpen: boolean
  sidebarDocked: boolean
  closeTimeout: NodeJS.Timeout | null
  onCloseSidebar: () => void
  onSetCloseTimeout: (timeout: NodeJS.Timeout | null) => void
}

export default function SidebarOverlay({
  sidebarOpen,
  sidebarDocked,
  closeTimeout,
  onCloseSidebar,
  onSetCloseTimeout
}: SidebarOverlayProps) {
  if (!sidebarOpen || sidebarDocked) return null

  return (
    <div 
      className="fixed left-80 top-0 w-full h-full z-20"
      onMouseEnter={() => {
        // Clear any existing timeout
        if (closeTimeout) {
          clearTimeout(closeTimeout)
        }
        // Add a delay before closing to make it more user-friendly
        const timeout = setTimeout(() => {
          onCloseSidebar()
        }, 200) // 200ms delay
        onSetCloseTimeout(timeout)
      }}
      onMouseLeave={() => {
        // Clear timeout when mouse leaves the overlay
        if (closeTimeout) {
          clearTimeout(closeTimeout)
          onSetCloseTimeout(null)
        }
      }}
      title="Move cursor outside to close sidebar"
    />
  )
} 