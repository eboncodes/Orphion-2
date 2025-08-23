"use client"

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Copy,
  Trash2,
  PanelLeftOpen,
  Plus,
  FileText,
  FilePlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { openInGoogleDocs } from "@/lib/integrations/googleDocs"
import { useSettings } from "@/contexts/SettingsContext"
import Tooltip from "@/components/ui/tooltip"

interface PageHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewTask: () => void;
  onNewPage: () => void;
  onDeletePage: () => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  pageContent?: string;
}

const PageHeader = ({ 
  sidebarOpen, 
  onToggleSidebar,
  onNewTask,
  onNewPage,
  onDeletePage,
  title: propTitle = "Untitled page",
  onTitleChange,
  pageContent = ""
}: PageHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [localTitle, setLocalTitle] = useState(propTitle)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { settings } = useSettings()
  
  // Update local title when prop changes
  useEffect(() => {
    setLocalTitle(propTitle)
  }, [propTitle])

  const handleTitleClick = () => {
    setIsEditing(true)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    // Limit to 50 characters
    if (newTitle.length <= 50) {
      setLocalTitle(newTitle);
    }
  }

  const handleTitleBlur = () => {
    setIsEditing(false);
    // Ensure title is never empty - show "Untitled" if empty
    if (!localTitle.trim()) {
      const finalTitle = "Untitled";
      setLocalTitle(finalTitle);
      onTitleChange?.(finalTitle);
    } else {
      onTitleChange?.(localTitle);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      // Ensure title is never empty - show "Untitled" if empty
      if (!localTitle.trim()) {
        const finalTitle = "Untitled";
        setLocalTitle(finalTitle);
        onTitleChange?.(finalTitle);
      } else {
        onTitleChange?.(localTitle);
      }
    } else if (e.key === 'Escape') {
      // Reset to previous value or "Untitled" if empty
      if (!localTitle.trim()) {
        setLocalTitle("Untitled");
      }
      e.currentTarget.blur();
    }
  }

  const handleOpenInGoogleDocs = async () => {
    if (!settings.googleDocsEnabled || !settings.googleDocsConnected) {
      toast({ title: 'Enable and connect Google Docs in Settings first' })
      return
    }
    await openInGoogleDocs(pageContent || '', localTitle, (msg) => toast({ title: msg }))
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="hover:bg-transparent focus:outline-none focus:ring-0" onClick={onToggleSidebar}>
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-transparent focus:outline-none focus:ring-0">
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onNewTask}>
                <FileText className="w-4 h-4 mr-2" />
                <span>Create a new task</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewPage}>
                <FilePlus className="w-4 h-4 mr-2" />
                <span>Create a new page</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center">
          {isEditing ? (
            <div className="flex flex-col items-center">
              <input
                type="text"
                value={localTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={handleKeyDown}
                className="font-medium bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 text-center"
                autoFocus
                maxLength={50}
              />
              <span className="text-xs text-gray-500 mt-1">
                {localTitle.length}/50
              </span>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-transparent focus:outline-none focus:ring-0" onClick={handleTitleClick}>
              <span className="font-medium">{localTitle}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hover:bg-transparent focus:outline-none focus:ring-0">
            <Copy className="w-5 h-5" />
          </Button>
          {/* Google Docs direct icon (no container) */}
          <Tooltip content="Open in Google Docs" position="bottom">
            <svg
              onClick={handleOpenInGoogleDocs}
              role="button"
              aria-label="Open in Google Docs"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenInGoogleDocs(); }}
              className="cursor-pointer select-none focus:outline-none outline-none"
              xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false"
            >
              <linearGradient id="pg10I3OeSC0NOv22QZ6aWa_v0YYnU84T2c4_gr1" x1="-209.942" x2="-179.36" y1="-3.055" y2="27.526" gradientTransform="translate(208.979 6.006)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#55adfd"></stop><stop offset="1" stopColor="#438ffd"></stop></linearGradient><path fill="url(#pg10I3OeSC0NOv22QZ6aWa_v0YYnU84T2c4_gr1)" d="M39.001,13.999v27c0,1.105-0.896,2-2,2h-26	c-1.105,0-2-0.895-2-2v-34c0-1.104,0.895-2,2-2h19l2,7L39.001,13.999z"></path><path fill="#fff" fillRule="evenodd" d="M15.999,18.001v2.999	h17.002v-2.999H15.999z" clipRule="evenodd"></path><path fill="#fff" fillRule="evenodd" d="M16.001,24.001v2.999	h17.002v-2.999H16.001z" clipRule="evenodd"></path><path fill="#fff" fillRule="evenodd" d="M15.999,30.001v2.999	h12.001v-2.999H15.999z" clipRule="evenodd"></path><linearGradient id="pg10I3OeSC0NOv22QZ6aWb_v0YYnU84T2c4_gr2" x1="-197.862" x2="-203.384" y1="-4.632" y2=".89" gradientTransform="translate(234.385 12.109)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#427fdb"></stop><stop offset="1" stopColor="#0c52bb"></stop></linearGradient><path fill="url(#pg10I3OeSC0NOv22QZ6aWb_v0YYnU84T2c4_gr2)" d="M30.001,13.999l0.001-9l8.999,8.999L30.001,13.999z"></path>
            </svg>
          </Tooltip>
          <Button variant="ghost" size="icon" className="hover:bg-transparent focus:outline-none focus:ring-0" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDeletePage()
          setShowDeleteDialog(false)
        }}
        title="Delete Page"
        message="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        icon={<Trash2 className="w-6 h-6 text-red-500" />}
      />
    </>
  )
}

export default PageHeader
