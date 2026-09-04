import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ROWBOAT CONSULTING SERVICES',
  description: 'ROWBOAT CONSULTING SERVICES — consulting, talent solutions, specialist services and careers.',
  keywords: ['ROWBOAT Consulting Services', 'consulting', 'talent solutions', 'careers', 'specialist services'],
  openGraph: {
    title: 'ROWBOAT CONSULTING SERVICES',
    description: 'Consulting, talent solutions, specialist services and careers.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
