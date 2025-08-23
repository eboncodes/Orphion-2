"use client"

import DashboardLayout from "@/components/dashboard/layout/DashboardLayout"
import MainContentArea from "@/components/dashboard/MainContentArea"
import { DashboardContentModular } from "@/components/dashboard/layout/modular"
import { useDashboardState } from "@/hooks/useDashboardState"
import AuthErrorBoundary from "@/components/auth/AuthErrorBoundary"
import { useAuth } from "@/contexts/AuthContext"
import AuthHeader from "@/components/auth/AuthHeader"

export default function DashboardPage() {
  const { isLoading: authLoading } = useAuth()
  
  const {
    // State
    sidebarOpen,
    sidebarDocked,
    closeTimeout,
    showSettings,
    chatKey,
    messages,
    currentConversationId,
    conversationTitle,
    isFavorite,
    
    // Handlers
    handleMessagesUpdate,
    handleNewChat,
    handleLoadConversation,
    handleTitleGenerated,
    handleToggleDock,
    handleToggleSidebar,
    handleCloseSidebar,
    handleToggleSettings,
    handleCloseSettings,
    handleToggleFavorite,
    handleConversationCreated,
    handleSetCloseTimeout,
    handleSidebarHoverEnter,
    handleSidebarHoverLeave
  } = useDashboardState()

  // Don't show loading overlay, let the auth context handle loading internally
  // The dashboard will render normally and auth components will show their own loading states if needed

  return (
    <AuthErrorBoundary>
      {/* Auth Elements - Top Right */}
      <div className="absolute top-0 right-0 p-4 z-10">
        <AuthHeader />
      </div>
      
      <DashboardLayout
        sidebarOpen={sidebarOpen}
        sidebarDocked={sidebarDocked}
        currentConversationId={currentConversationId}
        onToggleSidebar={handleToggleSidebar}
        onToggleDock={handleToggleDock}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onSettings={handleToggleSettings}
      >
        <MainContentArea
          sidebarOpen={sidebarOpen}
          sidebarDocked={sidebarDocked}
          onMouseEnter={handleSidebarHoverEnter}
          onMouseLeave={handleSidebarHoverLeave}
        >
          <DashboardContentModular
            sidebarOpen={sidebarOpen}
            sidebarDocked={sidebarDocked}
            closeTimeout={closeTimeout}
            showSettings={showSettings}
            chatKey={chatKey}
            messages={messages}
            currentConversationId={currentConversationId}
            conversationTitle={conversationTitle}
            isFavorite={isFavorite}
            onToggleSidebar={handleToggleSidebar}
            onToggleDock={handleToggleDock}
            onCloseSidebar={handleCloseSidebar}
            onSetCloseTimeout={handleSetCloseTimeout}
            onMessagesUpdate={handleMessagesUpdate}
            onToggleFavorite={handleToggleFavorite}
            onNewChat={handleNewChat}
            onConversationCreated={handleConversationCreated}
            onTitleGenerated={handleTitleGenerated}
            onCloseSettings={handleCloseSettings}
            onPageCreated={(pageId, pageTitle, pageContent) => {
              // Handle page creation - navigate to the page with canvas content
              if (typeof window !== 'undefined') {
                // Encode the page content for URL
                const encodedContent = encodeURIComponent(pageContent)
                window.location.href = `/pages?page=${pageId}&canvas=${encodedContent}&send=true`
              }
            }}
          />
        </MainContentArea>
      </DashboardLayout>
    </AuthErrorBoundary>
  )
} 