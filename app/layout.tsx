import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ROWBOAT JOBS | Every Industry. Every Opportunity. One Platform.',
  description: 'Discover employment opportunities across India across IT, manufacturing, pharmaceuticals, healthcare, finance, engineering, startups, government and other sectors.',
  keywords: ['Rowboat Jobs', 'jobs in India', 'careers India', 'employment opportunities', 'IT jobs', 'manufacturing jobs', 'pharma jobs', 'healthcare jobs', 'government jobs India', 'startup jobs'],
  openGraph: {
    title: 'ROWBOAT JOBS | Every Industry. Every Opportunity. One Platform.',
    description: 'Discover employment opportunities across India across diverse industries and sectors.',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}</body></html>
}
