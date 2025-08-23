"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { CheckCircle, X, Sun, Volume2, VolumeX, Settings as SettingsIcon, Link2, Unplug, User, Calendar, Mail, Database, Cloud, Grid3X3, HelpCircle, ArrowUpRight, Shield, Clock, Globe, Phone, Upload, Download, Trash2, Lock, FileText } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

import { useSettings } from "@/contexts/SettingsContext"
import { authorizeGoogleDrive } from "@/lib/integrations/googleDocs"
import { useSound } from "@/hooks/useSound"
import { useAuth } from "@/contexts/AuthContext"

interface SettingsPopupProps {
  onClose: () => void
  isOpen: boolean
}

export default function SettingsPopup({ onClose, isOpen }: SettingsPopupProps) {
  const [activeSection, setActiveSection] = useState('account')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const { settings, updateSetting, resetSettings: resetContextSettings } = useSettings()
  const { playSound } = useSound()
  const { user } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)

  // Session tracking
  const [sessionCount, setSessionCount] = useState(0)
  const [lastLoginTime, setLastLoginTime] = useState<Date | null>(null)

  // Data controls state
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importMessage, setImportMessage] = useState('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    usageAnalytics: false,
    errorReporting: true,
    thirdPartySharing: false
  })

  useEffect(() => {
    // Load session data from localStorage
    const savedSessionCount = localStorage.getItem('sessionCount')
    const savedLastLogin = localStorage.getItem('lastLoginTime')

    if (savedSessionCount) {
      setSessionCount(parseInt(savedSessionCount))
    }

    if (savedLastLogin) {
      setLastLoginTime(new Date(savedLastLogin))
    }

    // Track current session
    if (user && !savedLastLogin) {
      // First login or new session
      const newCount = (savedSessionCount ? parseInt(savedSessionCount) : 0) + 1
      setSessionCount(newCount)
      setLastLoginTime(new Date())

      localStorage.setItem('sessionCount', newCount.toString())
      localStorage.setItem('lastLoginTime', new Date().toISOString())
    }
  }, [user])

  // Load privacy settings from localStorage
  useEffect(() => {
    const savedPrivacySettings = localStorage.getItem('privacySettings')

    if (savedPrivacySettings) {
      setPrivacySettings({ ...privacySettings, ...JSON.parse(savedPrivacySettings) })
    }
  }, [])

  // Mock data for demonstration - in a real app, this would come from the backend
  const accountStats = {
    createdAt: new Date('2024-01-15')
  }

  const securityInfo = {
    emailVerified: true,
    passwordLastChanged: new Date('2024-03-10'),
    loginDevices: 2,
    activeSessions: sessionCount
  }

  const navigationItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
    { id: 'data-controls', label: 'Data controls', icon: Database },
    { id: 'connected-apps', label: 'Connected apps', icon: Grid3X3 },
  ]

  const renderIcon = (IconComponent: any) => {
    return <IconComponent className="w-5 h-5" />
  }

  const handleSettingChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value)
    playSound('success')
  }

  const handleClose = () => {
    onClose()
  }

  const resetSettings = () => {
    resetContextSettings()
    playSound('notification')
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    try {
      // Here you would typically call an API to delete the account
      // For now, we'll show a confirmation dialog
      setShowDeleteConfirm(true)
      playSound('notification')
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const confirmDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      return
    }

    try {
      // API call to delete account from Supabase would go here
      console.log('Account deletion confirmed and processed')

      // After successful deletion, refresh the page
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const handleExportData = async (format: 'zip' | 'json' | 'csv' = 'zip') => {
    try {
      if (format === 'json') {
        await handleJSONExport()
        return
      }

      if (format === 'csv') {
        await handleCSVExport()
        return
      }

      // Original ZIP export functionality
      await handleZIPExport()
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const handleZIPExport = async () => {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default as any
      const zip = new JSZip()

      // Create settings file
      const settingsContent = `ORPHION SETTINGS EXPORT
========================

Export Date: ${new Date().toLocaleString()}
User Agent: ${navigator.userAgent}

USER INFORMATION
----------------
Name: ${user?.name || 'N/A'}
Email: ${user?.email || 'N/A'}
Account Type: Standard

SETTINGS
--------
Theme: ${settings.theme}
Sound Enabled: ${settings.soundEnabled ? 'Yes' : 'No'}
Sound Volume: ${settings.soundVolume}%
Google Docs Enabled: ${settings.googleDocsEnabled ? 'Yes' : 'No'}
Google Docs Connected: ${settings.googleDocsConnected ? 'Yes' : 'No'}
Beta AI Enabled: ${settings.betaAIEnabled ? 'Yes' : 'No'}
Beta Collaboration Enabled: ${settings.betaCollaborationEnabled ? 'Yes' : 'No'}
Beta Analytics Enabled: ${settings.betaAnalyticsEnabled ? 'Yes' : 'No'}
`
      zip.file('settings.txt', settingsContent)

      // Create user profile file
      const profileContent = `ORPHION USER PROFILE
====================

Name: ${user?.name || 'N/A'}
Email: ${user?.email || 'N/A'}
Account Type: Standard
Export Date: ${new Date().toLocaleString()}

This file contains your basic profile information.
`
      zip.file('profile.txt', profileContent)

      // Create sample chat files (you would replace this with actual chat data)
      const sampleChats = [
        {
          id: 'chat-001',
          title: 'General Discussion',
          content: `Chat: General Discussion
Date: ${new Date().toLocaleString()}

User: Hello, how can I help you today?
Assistant: I'm here to assist you with any questions or tasks you have.

This is a sample chat conversation.
You would replace this with actual chat data from your database.
`,
          date: new Date().toISOString()
        },
        {
          id: 'chat-002',
          title: 'Project Planning',
          content: `Chat: Project Planning
Date: ${new Date().toLocaleString()}

User: I need help planning a new project.
Assistant: I'd be happy to help you plan your project. What type of project is it?

User: It's a web development project.
Assistant: Great! For web development, we should consider:
- Technology stack
- Timeline
- Budget
- Team requirements

This is a sample project planning chat.
You would replace this with actual project data.
`,
          date: new Date().toISOString()
        }
      ]

      sampleChats.forEach((chat, index) => {
        const chatFileName = `chats/${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
        zip.file(chatFileName, chat.content)
      })

      // Create sample page files (you would replace this with actual page data)
      const samplePages = [
        {
          id: 'page-001',
          title: 'Welcome Page',
          content: `PAGE: Welcome Page
==================

Created: ${new Date().toLocaleString()}
Last Modified: ${new Date().toLocaleString()}

Content:
--------
Welcome to Orphion!

This is your welcome page. You can use this space to create notes, documents, and organize your thoughts.

Features:
- Rich text editing
- File attachments
- Collaboration tools
- Custom organization

This is sample page content.
You would replace this with actual page data from your database.
`
        },
        {
          id: 'page-002',
          title: 'Meeting Notes',
          content: `PAGE: Meeting Notes
==================

Created: ${new Date().toLocaleString()}
Last Modified: ${new Date().toLocaleString()}

Meeting Date: ${new Date().toLocaleDateString()}

Attendees:
- John Doe
- Jane Smith
- You

Discussion Points:
1. Project timeline
2. Budget allocation
3. Resource planning
4. Next steps

Action Items:
- [ ] Complete project proposal
- [ ] Schedule follow-up meeting
- [ ] Update documentation

This is sample meeting notes content.
You would replace this with actual meeting data.
`
        }
      ]

      samplePages.forEach((page, index) => {
        const pageFileName = `pages/${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
        zip.file(pageFileName, page.content)
      })

      // Create metadata file
      const metadataContent = `ORPHION EXPORT METADATA
=========================

Export Information:
- Export Date: ${new Date().toISOString()}
- User: ${user?.email || 'N/A'}
- Total Chats: ${sampleChats.length}
- Total Pages: ${samplePages.length}
- Settings Exported: Yes

File Structure:
- settings.txt: User settings and preferences
- profile.txt: Basic user profile information
- chats/: Directory containing all chat conversations
- pages/: Directory containing all pages and documents
- metadata.txt: This file (export information)

Note: This is a sample export structure.
Replace sample data with actual user data from your database.
`
      zip.file('metadata.txt', metadataContent)

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orphion-data-export-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    playSound('success')
  }

  const handleJSONExport = async () => {
    try {
      // Get actual data from localStorage
      const chatHistory = localStorage.getItem('chatHistory')
      const pageHistory = localStorage.getItem('pageHistory')
      const importedData = localStorage.getItem('importedData')

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportFormat: 'json',
          userAgent: navigator.userAgent,
          version: '1.0'
        },
        user: {
          name: user?.name || 'N/A',
          email: user?.email || 'N/A',
          accountType: 'Standard'
        },
        settings: settings,
        privacySettings: privacySettings,
        data: {
          chats: chatHistory ? JSON.parse(chatHistory) : [],
          pages: pageHistory ? JSON.parse(pageHistory) : [],
          imported: importedData ? JSON.parse(importedData) : null
        }
      }

      // Create and download JSON file
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orphion-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      playSound('success')
    } catch (error) {
      console.error('Failed to export JSON data:', error)
    }
  }

  const handleCSVExport = async () => {
    try {
      // Get actual data from localStorage
      const chatHistory = localStorage.getItem('chatHistory')
      const pageHistory = localStorage.getItem('pageHistory')

      // Create CSV content for chats
      let csvContent = 'Type,Title,Content,Date\n'

      if (chatHistory) {
        const chats = JSON.parse(chatHistory)
        chats.forEach((chat: any) => {
          const title = chat.title?.replace(/"/g, '""') || 'Untitled'
          const content = chat.content?.replace(/"/g, '""') || ''
          const date = chat.date || new Date().toISOString()
          csvContent += `"chat","${title}","${content}","${date}"\n`
        })
      }

      if (pageHistory) {
        const pages = JSON.parse(pageHistory)
        pages.forEach((page: any) => {
          const title = page.title?.replace(/"/g, '""') || 'Untitled'
          const content = page.content?.replace(/"/g, '""') || ''
          const date = page.date || new Date().toISOString()
          csvContent += `"page","${title}","${content}","${date}"\n`
        })
      }

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orphion-data-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      playSound('success')
    } catch (error) {
      console.error('Failed to export CSV data:', error)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      setImportMessage('Please select a valid ZIP file')
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setImportMessage('Starting import...')
    setShowImportDialog(true)

    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default as any
      const zip = await JSZip.loadAsync(file)

      setImportProgress(25)
      setImportMessage('Extracting files...')

      // Process files
      const files = Object.keys(zip.files)
      const importedData = {
        settings: null as any,
        chats: [] as any[],
        pages: [] as any[],
        profile: null as any
      }

      for (const fileName of files) {
        if (fileName.endsWith('settings.txt')) {
          const content = await zip.files[fileName].async('text')
          importedData.settings = parseSettingsFile(content)
        } else if (fileName.startsWith('chats/') && fileName.endsWith('.txt')) {
          const content = await zip.files[fileName].async('text')
          importedData.chats.push(parseChatFile(content, fileName))
        } else if (fileName.startsWith('pages/') && fileName.endsWith('.txt')) {
          const content = await zip.files[fileName].async('text')
          importedData.pages.push(parsePageFile(content, fileName))
        } else if (fileName.endsWith('profile.txt')) {
          const content = await zip.files[fileName].async('text')
          importedData.profile = parseProfileFile(content)
        }
      }

      setImportProgress(75)
      setImportMessage('Validating data...')

      // Validate imported data
      if (!importedData.settings) {
        throw new Error('Settings file not found in import')
      }

      setImportProgress(90)
      setImportMessage('Saving data...')

      // Here you would typically save the imported data to your backend/database
      // For now, we'll just store it in localStorage
      localStorage.setItem('importedData', JSON.stringify(importedData))

      // Update settings if they were imported
      if (importedData.settings) {
        Object.keys(importedData.settings).forEach(key => {
          if (key in settings) {
            updateSetting(key as keyof typeof settings, importedData.settings[key])
          }
        })
      }

      setImportProgress(100)
      setImportMessage('Import completed successfully!')

      // Clear the file input
      event.target.value = ''

      playSound('success')

      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowImportDialog(false)
        setIsImporting(false)
        setImportProgress(0)
        setImportMessage('')
      }, 2000)

    } catch (error) {
      console.error('Failed to import data:', error)
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => {
        setShowImportDialog(false)
        setIsImporting(false)
        setImportProgress(0)
        setImportMessage('')
      }, 3000)
    }
  }

  const parseSettingsFile = (content: string) => {
    const settings: any = {}
    const lines = content.split('\n')

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          // Convert string values to appropriate types
          if (value === 'Yes' || value === 'true') {
            settings[key.toLowerCase().replace(/\s+/g, '')] = true
          } else if (value === 'No' || value === 'false') {
            settings[key.toLowerCase().replace(/\s+/g, '')] = false
          } else if (!isNaN(Number(value))) {
            settings[key.toLowerCase().replace(/\s+/g, '')] = Number(value)
          } else {
            settings[key.toLowerCase().replace(/\s+/g, '')] = value
          }
        }
      }
    }

    return settings
  }

  const parseChatFile = (content: string, fileName: string) => {
    const lines = content.split('\n')
    return {
      id: `imported_${Date.now()}_${Math.random()}`,
      title: fileName.replace('chats/', '').replace('.txt', '').replace(/_/g, ' '),
      content: content,
      date: new Date(lines[1]?.split(': ')[1] || Date.now()).toISOString(),
      imported: true
    }
  }

  const parsePageFile = (content: string, fileName: string) => {
    const lines = content.split('\n')
    return {
      id: `imported_${Date.now()}_${Math.random()}`,
      title: fileName.replace('pages/', '').replace('.txt', '').replace(/_/g, ' '),
      content: content,
      date: new Date(lines[2]?.split(': ')[1] || Date.now()).toISOString(),
      imported: true
    }
  }

  const parseProfileFile = (content: string) => {
    const profile: any = {}
    const lines = content.split('\n')

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value && value !== 'N/A') {
          profile[key.toLowerCase().replace(/\s+/g, '')] = value
        }
      }
    }

    return profile
  }

  const updatePrivacySetting = (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }))
    // Here you would typically save to backend
    localStorage.setItem('privacySettings', JSON.stringify({ ...privacySettings, [key]: value }))
  }



  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&display=swap');

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .orphion-logo {
          font-family: 'DM Serif Text', serif;
          font-weight: normal;
          font-style: italic;
        }
      `}</style>
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[600px] flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 flex flex-col">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <span className="text-2xl orphion-logo text-gray-900">Orphion</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {renderIcon(item.icon)}
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Help Section */}
          <div className="pt-4 border-t border-gray-200">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Get help</span>
              </div>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">{activeSection}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-10 h-10 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Dynamic Content Based on Active Section */}
          {activeSection === 'account' && (
            <div className="space-y-8">
              {/* Account Overview */}
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-6">Account Overview</h2>
                <Card className="bg-white border-gray-200 shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback to letter avatar if image fails to load
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center ${user?.avatar_url ? 'hidden' : ''}`}
                        >
                          <span className="text-white font-bold text-2xl">
                            {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        {user?.avatar_url && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              className="w-3 h-3"
                              aria-hidden="true"
                            >
                              <path fill="#4285f4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{user?.name || 'User'}</h3>
                        <p className="text-gray-600">{user?.email || 'No email'}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Verified Account</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>



              {/* Security Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Security & Privacy</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">Email Verification</span>
                        </div>
                        {securityInfo.emailVerified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {securityInfo.emailVerified ? 'Verified' : 'Not verified'}
                      </p>
                    </div>


                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Last Login</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {lastLoginTime ? `${lastLoginTime.toLocaleDateString()} at ${lastLoginTime.toLocaleTimeString()}` : 'Never logged in'}
                      </p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Session Count</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {sessionCount} total session{sessionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-8">
              {/* General Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">General</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="language" className="text-sm font-medium text-gray-900">
                      Language
                    </Label>
                    <Select value="english" onValueChange={() => {}}>
                      <SelectTrigger className="w-32 bg-gray-100 border-0 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="spanish">Spanish</SelectItem>
                        <SelectItem value="french">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Appearance Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Appearance</h2>
                <div className="flex gap-4">
                  {/* Light Theme */}
                  <button
                    onClick={() => handleSettingChange('theme', 'light')}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                      settings.theme === 'light' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-16 h-12 bg-white border border-gray-200 rounded mb-2 flex flex-col gap-1 p-1">
                      <div className="w-full h-1 bg-gray-200 rounded"></div>
                      <div className="w-3/4 h-1 bg-gray-200 rounded"></div>
                      <div className="w-1/2 h-1 bg-gray-200 rounded"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Light</span>
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => handleSettingChange('theme', 'dark')}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                      settings.theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-16 h-12 bg-gray-800 border border-gray-600 rounded mb-2 flex flex-col gap-1 p-1">
                      <div className="w-full h-1 bg-gray-600 rounded"></div>
                      <div className="w-3/4 h-1 bg-gray-600 rounded"></div>
                      <div className="w-1/2 h-1 bg-gray-600 rounded"></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Dark</span>
                  </button>

                  {/* Follow System */}
                  <button
                    onClick={() => handleSettingChange('theme', 'system')}
                    className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                      settings.theme === 'system' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-16 h-12 rounded mb-2 flex">
                      <div className="w-1/2 bg-white border border-gray-200 rounded-l flex flex-col gap-1 p-1">
                        <div className="w-full h-1 bg-gray-200 rounded"></div>
                        <div className="w-3/4 h-1 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-1/2 bg-gray-800 border border-gray-600 rounded-r flex flex-col gap-1 p-1">
                        <div className="w-full h-1 bg-gray-600 rounded"></div>
                        <div className="w-3/4 h-1 bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Follow System</span>
                  </button>
                </div>
              </div>

              {/* Beta Features Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Beta Features</h2>
                <div className="space-y-6">
                  {/* Advanced AI Features */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Advanced AI Processing
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Enable experimental AI features for enhanced processing capabilities and smarter automation.
                      </p>
                    </div>
                    <Switch
                      checked={settings.betaAIEnabled || false}
                      onCheckedChange={(checked) => handleSettingChange('betaAIEnabled', checked)}
                      className="ml-4"
                    />
                  </div>

                  {/* Real-time Collaboration */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Real-time Collaboration
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Enable live collaboration features for team projects and shared workspaces (Beta).
                      </p>
                    </div>
                    <Switch
                      checked={settings.betaCollaborationEnabled || false}
                      onCheckedChange={(checked) => handleSettingChange('betaCollaborationEnabled', checked)}
                      className="ml-4"
                    />
                  </div>

                  {/* Advanced Analytics */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Advanced Analytics Dashboard
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Access detailed performance metrics and usage analytics with advanced reporting features.
                      </p>
                    </div>
                    <Switch
                      checked={settings.betaAnalyticsEnabled || false}
                      onCheckedChange={(checked) => handleSettingChange('betaAnalyticsEnabled', checked)}
                      className="ml-4"
                    />
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-700 text-sm">
                      Beta features are experimental and may be unstable. Please report any issues you encounter.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <Separator />

              {/* Audio Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Audio
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="soundEnabled" className="text-sm font-medium">
                      Enable Sounds
                    </Label>
                    <Switch
                      id="soundEnabled"
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                    />
                  </div>

                  {settings.soundEnabled && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="soundVolume" className="text-sm font-medium">
                        Volume
                      </Label>
                      <div className="flex items-center gap-2 w-32">
                        <Slider
                          value={[settings.soundVolume]}
                          onValueChange={(value) => handleSettingChange('soundVolume', value[0])}
                          max={100}
                          min={0}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs w-8">{settings.soundVolume}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}



          {activeSection === 'data-controls' && (
            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Data Controls</h2>



              {/* Import/Export Data */}
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Export Data</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Download all your data including conversations, settings, and preferences.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportData('zip')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export as ZIP
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportData('json')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportData('csv')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as CSV
                  </Button>
                </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Import Data</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Upload previously exported data to restore your settings and content.</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-data"
                      disabled={isImporting}
                    />
                    <label htmlFor="import-data">
                      <Button variant="outline" size="sm" asChild disabled={isImporting}>
                        <span className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          {isImporting ? 'Importing...' : 'Import from ZIP'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>



              {/* Privacy Controls */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Privacy Controls</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Data Collection</h4>
                      <p className="text-xs text-gray-600">Allow anonymous usage data collection to improve the app</p>
                    </div>
                    <Switch
                      checked={privacySettings.dataCollection}
                      onCheckedChange={(checked) => updatePrivacySetting('dataCollection', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Usage Analytics</h4>
                      <p className="text-xs text-gray-600">Share detailed usage analytics for research purposes</p>
                    </div>
                    <Switch
                      checked={privacySettings.usageAnalytics}
                      onCheckedChange={(checked) => updatePrivacySetting('usageAnalytics', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Error Reporting</h4>
                      <p className="text-xs text-gray-600">Automatically report crashes and errors to help fix issues</p>
                    </div>
                    <Switch
                      checked={privacySettings.errorReporting}
                      onCheckedChange={(checked) => updatePrivacySetting('errorReporting', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Third-party Sharing</h4>
                      <p className="text-xs text-gray-600">Allow sharing anonymized data with trusted partners</p>
                    </div>
                    <Switch
                      checked={privacySettings.thirdPartySharing}
                      onCheckedChange={(checked) => updatePrivacySetting('thirdPartySharing', checked)}
                    />
                  </div>
                </div>
              </div>





              {/* Delete Account */}
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                  >
                  <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
              </div>
            </div>
          )}

          {activeSection === 'connected-apps' && (
            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Connected Apps</h2>
              <div className="space-y-4">
                {/* Google Drive */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          className="w-4 h-4"
                          aria-hidden="true"
                        >
                          <path fill="#1e88e5" d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61 c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z"></path>
                          <path fill="#fbc02d" d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996 c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z"></path>
                          <path fill="#e53935" d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z"></path>
                          <path fill="#4caf50" d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996 c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z"></path>
                          <path fill="#1565c0" d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z"></path>
                          <path fill="#2e7d32" d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z"></path>
                        </svg>
                        <span className="font-medium">Google Drive</span>
                        {settings.googleDocsConnected ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Connected</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">Not connected</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Connect Google Drive to import files and export documents.</p>
                    </div>
                    <Switch
                      id="googleDocsEnabled"
                      checked={settings.googleDocsEnabled}
                      onCheckedChange={(checked) => handleSettingChange('googleDocsEnabled', checked)}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {!settings.googleDocsConnected ? (
                      <Button size="sm" onClick={async () => {
                        const token = await authorizeGoogleDrive()
                        if (token) {
                          handleSettingChange('googleDocsConnected', true)
                        }
                      }}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          className="w-4 h-4 mr-2"
                          aria-hidden="true"
                        >
                          <path fill="#1e88e5" d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61 c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z"></path>
                          <path fill="#fbc02d" d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996 c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z"></path>
                          <path fill="#e53935" d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z"></path>
                          <path fill="#4caf50" d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996 c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z"></path>
                          <path fill="#1565c0" d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z"></path>
                          <path fill="#2e7d32" d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z"></path>
                        </svg>
                        Connect
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleSettingChange('googleDocsConnected', false)}>
                        <Unplug className="w-4 h-4 mr-2" /> Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Import Progress Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              {isImporting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {isImporting ? 'Importing Data' : 'Import Complete'}
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">{importMessage}</p>
              {isImporting && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {!isImporting && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Delete Account Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your data.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Type <strong>DELETE</strong> in the box below to confirm:
            </p>
            <Input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mb-6"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteConfirmationText === 'DELETE') {
                  confirmDeleteAccount()
                }
              }}
            />
            <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmationText('')
                }}
              >
                Cancel
            </Button>
            <Button 
                variant="destructive"
                onClick={confirmDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE'}
            >
                Delete Account
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
    </>
  )
}
