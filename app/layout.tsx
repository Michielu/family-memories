import type { Metadata } from 'next'
import { Inter, Hedvig_Letters_Serif } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const hedvig = Hedvig_Letters_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-hedvig',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Memory Letters',
  description: 'Weekly letters to my kids',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${hedvig.variable}`}>
      <body className="bg-[#f9fbf2] text-[#130e30] font-[family-name:var(--font-inter)] antialiased">
        {children}
      </body>
    </html>
  )
}
