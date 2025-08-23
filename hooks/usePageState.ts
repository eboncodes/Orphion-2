import { useState, useCallback } from "react"

export function usePageState() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarDocked, setSidebarDocked] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen)
  }, [sidebarOpen])

  const handleToggleDock = useCallback(() => {
    setSidebarDocked(!sidebarDocked)
  }, [sidebarDocked])

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])
  
  const handleSidebarHoverEnter = useCallback(() => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      setCloseTimeout(null)
    }
    if (!sidebarOpen && !sidebarDocked) {
      setSidebarOpen(true)
    }
  }, [sidebarOpen, sidebarDocked, closeTimeout])

  const handleSidebarHoverLeave = useCallback(() => {
    if (sidebarOpen && !sidebarDocked) {
      const timeout = setTimeout(() => {
        setSidebarOpen(false)
      }, 300)
      setCloseTimeout(timeout)
    }
  }, [sidebarOpen, sidebarDocked])
  
  return {
    sidebarOpen,
    sidebarDocked,
    handleToggleSidebar,
    handleToggleDock,
    handleCloseSidebar,
    handleSidebarHoverEnter,
    handleSidebarHoverLeave
  }
}
