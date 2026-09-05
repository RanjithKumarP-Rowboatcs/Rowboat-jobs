import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ROWBOAT Consulting Services | Jobs & Opportunities',
  description: 'ROWBOAT Consulting Services — an India-first platform for discovering employment opportunities across industries and sectors.',
  keywords: ['Rowboat Consulting Services', 'Rowboat Jobs', 'jobs in India', 'careers India', 'employment opportunities', 'IT jobs', 'manufacturing jobs', 'pharma jobs', 'healthcare jobs', 'government jobs India', 'startup jobs'],
  icons: { icon: '/rowboat-mark.svg', apple: '/rowboat-mark.svg' },
  openGraph: {
    title: 'ROWBOAT Consulting Services | Jobs & Opportunities',
    description: 'Every Industry. Every Opportunity. One Platform.',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}</body></html>
}
