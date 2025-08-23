export interface DashboardContentProps {
  sidebarOpen: boolean
  sidebarDocked: boolean
  closeTimeout: NodeJS.Timeout | null
  showSettings: boolean
  chatKey: number
  messages: any[]
  currentConversationId: string | null
  conversationTitle: string
  isFavorite: boolean
  onToggleSidebar: () => void
  onToggleDock: () => void
  onCloseSidebar: () => void
  onSetCloseTimeout: (timeout: NodeJS.Timeout | null) => void
  onMessagesUpdate: (messages: any[]) => void
  onToggleFavorite: () => void
  onNewChat: () => void
  onConversationCreated: (conversationId: string) => void
  onTitleGenerated: (title: string) => void
  onCloseSettings: () => void
  onPageCreated?: (pageId: string, pageTitle: string, pageContent: string) => void
}

export interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  attachedFile?: { file: File; preview: string; type: 'image' | 'document' | 'pdf' | 'excel' | 'csv' }


  executableCode?: any
}

export interface FileAttachment {
  file: File
  preview: string
  type: 'image' | 'document' | 'pdf' | 'excel' | 'csv'
}

export type ToolType = 'study' | 'image' | 'pages' | 'table' | 'webpage' | null
