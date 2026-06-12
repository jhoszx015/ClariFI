import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

import { AmbientBackground } from '@/components/clarifi/ambient-background'
import { AppCustomCursor } from '@/components/clarifi/app-custom-cursor'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'ClariFI — Gestão financeira inteligente',
  description:
    'Plataforma de gestão financeira inteligente com foco em mudança de comportamento, acompanhamento patrimonial e prevenção de decisões impulsivas.',
  generator: 'ClariFI',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <ThemeProvider>
          <AmbientBackground />
          <AppCustomCursor />
          <div className="relative z-[1] min-h-screen">{children}</div>
          <Toaster richColors position="top-center" closeButton />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
