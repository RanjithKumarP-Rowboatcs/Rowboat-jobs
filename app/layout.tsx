import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ROWBOAT CONSULTING SERVICES | Consulting, Talent & Careers',
  description: 'ROWBOAT CONSULTING SERVICES — consulting, talent and career opportunities.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
