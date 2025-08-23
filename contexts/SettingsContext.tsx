"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  soundEnabled: boolean
  soundVolume: number
  autoSave: boolean
  notifications: boolean
  googleDocsEnabled: boolean
  googleDocsConnected: boolean
  betaAIEnabled: boolean
  betaCollaborationEnabled: boolean
  betaAnalyticsEnabled: boolean
}

interface SettingsContextType {
  settings: SettingsState
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  resetSettings: () => void
  applySettings: () => void
}

const defaultSettings: SettingsState = {
  theme: 'system',
  soundEnabled: true,
  soundVolume: 70,
  autoSave: true,
  notifications: true,
  googleDocsEnabled: true,
  googleDocsConnected: false,
  betaAIEnabled: false,
  betaCollaborationEnabled: false,
  betaAnalyticsEnabled: false
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  
  console.log('SettingsProvider: Initialized with settings:', settings)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('orphion-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('orphion-settings', JSON.stringify(settings))
  }, [settings])

  // Apply theme changes
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      const { theme } = settings
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.toggle('dark', systemTheme === 'dark')
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    applyTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (settings.theme === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.theme])



  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('orphion-settings')
  }

  const applySettings = () => {
    // Apply all current settings
    const root = document.documentElement
    
    // Apply theme
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', settings.theme === 'dark')
    }
    
    // Keep other visual preferences hook points if needed in future
  }

  const value: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
    applySettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
