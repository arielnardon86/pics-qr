import type { Metadata } from 'next'
import { Inter, Exo_2 } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Total Pics — Tus momentos, en grande',
  description: 'Compartí y proyectá fotos de tus eventos en tiempo real',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${exo2.variable}`}>
      <body className="min-h-full bg-[#09090b] text-white">
        {children}
      </body>
    </html>
  )
}
