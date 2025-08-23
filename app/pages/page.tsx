"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard/layout/DashboardLayout"
import PageView from "@/components/pages/PageView"
import { usePageState } from "@/hooks/usePageState"
import PageContentArea from "@/components/pages/PageContentArea"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatConversation } from "@/lib/chat-storage"
import { PageConversation } from "@/lib/page-storage"
import SettingsPopup from "@/components/dashboard/ui/SettingsPopup"

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageId = searchParams.get('page')
  
  const {
    sidebarOpen,
    sidebarDocked,
    handleToggleSidebar,
    handleToggleDock,
    handleCloseSidebar,
    handleSidebarHoverEnter,
    handleSidebarHoverLeave,
  } = usePageState()

  const [pageTitle, setPageTitle] = useState("Untitled page")
  const [showSettings, setShowSettings] = useState(false)

  const handleNewChat = () => {
    router.push('/dashboard')
  }

  const handleLoadConversation = (conversation: ChatConversation | PageConversation) => {
    if ('pageContent' in conversation) {
      // This is a page conversation
      router.push(`/pages?page=${conversation.id}`)
    } else {
      // This is a chat conversation
      router.push(`/dashboard?conversation=${conversation.id}`)
    }
  }

  const handleNewPage = () => {
    // Create a new page by navigating to pages without a page ID
    router.push('/pages')
  }

  const handleTitleChange = (newTitle: string) => {
    setPageTitle(newTitle)
  }

  const handleDeletePage = () => {
    // For now, just redirects to the dashboard
    router.push('/dashboard')
  }

  return (
    <>
      <DashboardLayout
        sidebarOpen={sidebarOpen}
        sidebarDocked={sidebarDocked}
        currentConversationId={pageId}
        onToggleSidebar={handleToggleSidebar}
        onToggleDock={handleToggleDock}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onSettings={() => setShowSettings(true)}
      >
        <PageContentArea
          sidebarOpen={sidebarOpen}
          sidebarDocked={sidebarDocked}
          onMouseEnter={handleSidebarHoverEnter}
          onMouseLeave={handleSidebarHoverLeave}
        >
          <PageView
            sidebarOpen={sidebarOpen}
            sidebarDocked={sidebarDocked}
            onToggleSidebar={handleToggleSidebar}
            onToggleDock={handleToggleDock}
            onCloseSidebar={handleCloseSidebar}
            onNewTask={handleNewChat}
            onNewPage={handleNewPage}
            onDeletePage={handleDeletePage}
            title={pageTitle}
            onTitleChange={handleTitleChange}
          />
        </PageContentArea>
      </DashboardLayout>
      <SettingsPopup isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
