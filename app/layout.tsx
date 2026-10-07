import type { Metadata } from 'next'
import './globals.css'
import './brand-overrides.css'
import './opportunities/opportunities.css'
import './admin/admin.css'

export const metadata: Metadata = {
  title: 'ROWBOAT Consulting Services | Jobs & Opportunities',
  description: 'ROWBOAT Consulting Services — a global platform for discovering employment opportunities, talent and consulting opportunities across markets and sectors.',
  keywords: ['Rowboat Consulting Services', 'Rowboat Jobs', 'global jobs', 'employment opportunities', 'IT jobs', 'manufacturing jobs', 'careers', 'talent', 'consulting services', 'global opportunities'],
  icons: { icon: '/rowboat-mark.svg', apple: '/rowboat-mark.svg' },
  openGraph: { title: 'ROWBOAT Consulting Services | Jobs & Opportunities', description: 'Every Industry. Every Opportunity. One Platform.', type: 'website' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
