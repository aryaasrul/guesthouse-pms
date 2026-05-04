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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guesthouse-pms.vercel.app'
  ),
  title: {
    default: 'Guesthouse of Terang — Penginapan & Sewa Kamar Murah Ponorogo',
    template: '%s | Guesthouse of Terang',
  },
  description:
    'Penginapan murah di Ponorogo, Jawa Timur. WiFi, AC, dapur, parkir luas. Sewa kamar atau seluruh rumah untuk keluarga & rombongan. Pesan langsung online.',
  icons: { icon: '/logo.png' },
  verification: {
    google: 'YWp71oFLogJefzAp9a9QBNdfq0fjmyYIZn7s09-L-fM',
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
