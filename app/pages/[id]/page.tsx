"use client"

import DashboardLayout from "@/components/dashboard/layout/DashboardLayout"
import PageView from "@/components/pages/PageView"
import { usePageState } from "@/hooks/usePageState"
import PageContentArea from "@/components/pages/PageContentArea"
import { useRouter } from "next/navigation"
import { ChatConversation } from "@/lib/chat-storage"
import { Toaster } from "@/components/ui/toaster"
import { use } from "react"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function Page({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  
  const {
    sidebarOpen,
    sidebarDocked,
    handleToggleSidebar,
    handleToggleDock,
    handleCloseSidebar,
    handleSidebarHoverEnter,
    handleSidebarHoverLeave,
  } = usePageState()

  const handleNewChat = () => {
    router.push('/dashboard')
  }

  const handleLoadConversation = (conversation: ChatConversation) => {
    router.push(`/dashboard?conversation=${conversation.id}`)
  }

  const handleNewPage = () => {
    // For now, just reloads the page to create a "new" one
    router.push('/pages')
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
        currentConversationId={null}
        onToggleSidebar={handleToggleSidebar}
        onToggleDock={handleToggleDock}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onSettings={() => {}}
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
          />
        </PageContentArea>
      </DashboardLayout>
      <Toaster />
    </>
  )
}
