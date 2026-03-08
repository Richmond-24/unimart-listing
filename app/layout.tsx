import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ListAI — Snap. List. Sell.',
  description: 'Upload a product photo. AI fills your entire listing instantly.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
