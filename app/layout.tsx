import type { Metadata } from 'next'
import { Inter, Playfair_Display, Great_Vibes } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  variable: '--font-great-vibes',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Freedom Fotos — Fotos de tus eventos',
  description: 'Compartí y proyectá fotos de tus eventos en tiempo real',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`h-full ${inter.variable} ${playfair.variable} ${greatVibes.variable}`}
    >
      <body className="min-h-full bg-[#080808] text-[#F5EDD8]">
        {children}
      </body>
    </html>
  )
}
