import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Anek_Bangla } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { SettingsProvider } from '@/contexts/SettingsContext'

// Initialize the Bengali font
const anekBangla = Anek_Bangla({
  subsets: ['bengali'],
  variable: '--font-bangla',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Orphion - AI Agent',
  description: 'Your Gen-Z AI agent powered by TEJ Intelligence',
  generator: 'Orphion',
  icons: {
    icon: '/favicon.ico',
    apple: '/ophion-icon-black.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${anekBangla.variable}`}>
      <head>
        <style>{`
html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-bangla: ${anekBangla.variable};
}
        `}</style>
      </head>
      <body className="h-screen w-screen overflow-hidden">
        <AuthProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
