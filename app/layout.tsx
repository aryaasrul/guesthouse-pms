import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Guesthouse of Terang',
  description: 'Sistem Manajemen Properti — Guesthouse of Terang, Ponorogo',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${sans.variable} ${mono.variable}`} style={{ fontFamily: 'var(--font-sans)' }}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
