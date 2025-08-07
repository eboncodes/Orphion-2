import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Anek_Bangla, Radley } from 'next/font/google'
import './globals.css'

// Initialize the Bengali font
const anekBangla = Anek_Bangla({
  subsets: ['bengali'],
  variable: '--font-bangla',
  display: 'swap',
  preload: true,
})

// Initialize Radley font
const radely = Radley({
  subsets: ['latin'],
  variable: '--font-radely',
  display: 'swap',
  weight: ['400'],
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
    <html lang="en" className={`${anekBangla.variable} ${radely.variable}`}>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-bangla: ${anekBangla.variable};
  --font-radely: ${radely.variable};
}
        `}</style>
      </head>
      <body className="h-screen w-screen overflow-hidden">{children}</body>
    </html>
  )
}
