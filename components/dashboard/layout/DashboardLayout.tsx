"use client"

import { ReactNode } from "react"
import Sidebar from "./Sidebar"

interface DashboardLayoutProps {
  sidebarOpen: boolean
  sidebarDocked: boolean
  currentConversationId: string | null
  onToggleSidebar: () => void
  onToggleDock: () => void
  onNewChat: () => void
  onLoadConversation: (conversation: any) => void
  onSettings: () => void
  children: ReactNode
}

export default function DashboardLayout({
  sidebarOpen,
  sidebarDocked,
  currentConversationId,
  onToggleSidebar,
  onToggleDock,
  onNewChat,
  onLoadConversation,
  onSettings,
  children
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isDocked={sidebarDocked}
        onToggle={onToggleSidebar}
        onToggleDock={onToggleDock}
        onNewChat={onNewChat}
        onLoadConversation={onLoadConversation}
        onSettings={onSettings}
        currentConversationId={currentConversationId}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
} 