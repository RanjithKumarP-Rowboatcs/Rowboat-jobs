import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ROWBOAT JOBS | Jobs, Projects & Talent',
  description: 'India-first jobs, freelance projects and talent solutions by ROWBOAT.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
