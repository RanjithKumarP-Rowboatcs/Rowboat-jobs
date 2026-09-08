'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/browser'

type Profile = {
  full_name?: string | null
  company_name?: string | null
  role?: string | null
  employer_status?: string | null
}

export default function EmployerPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEmployer()
  }, [])

  async function loadEmployer() {
    try {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        location.href = '/login'
        return
      }

      setEmail(data.user.email || '')
      const response = await fetch('/api/profile', { cache: 'no-store' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.error || 'Unable to load your company profile.')
      setProfile(body.profile || {
        full_name: data.user.user_metadata?.full_name || '',
        company_name: data.user.user_metadata?.company_name || '',
        employer_status: body.employer_status,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the employer dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    location.href = '/login'
  }

  return (
    <main className="portalShell">
      <header className="portalHeader">
        <a href="/">
          <img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES" />
        </a>
        <div>
          <a className="portalHeaderLink" href="/opportunities">View opportunities</a>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className="dashboardWrap">
        <section className="dashboardHero">
          <div>
            <div className="eyebrow">EMPLOYER PORTAL</div>
            <h1>Build your team.</h1>
            <p>
              Your Rowboat employer workspace is connected to the same secure account used for recruitment.
            </p>
          </div>
        </section>

        {loading && <div className="portalPanel">Loading your employer dashboard…</div>}

        {!loading && (
          <>
            {error && <div className="portalMessage error" style={{ marginBottom: 24 }}>{error}</div>}

            <div className="portalGrid">
              <section className="portalPanel">
                <div className="panelHeading">
                  <h2>Company profile</h2>
                  <span className="portalBadge pending">Pending review</span>
                </div>

                <div className="portalForm">
                  <label>
                    Company
                    <input value={profile?.company_name || ''} readOnly />
                  </label>
                  <label>
                    Contact name
                    <input value={profile?.full_name || ''} readOnly />
                  </label>
                  <label>
                    Email
                    <input value={email} readOnly />
                  </label>
                </div>
              </section>

              <section className="portalPanel">
                <h2>What happens next?</h2>
                <div className="portalNotice">
                  <strong>Your employer account needs Rowboat approval.</strong>
                  <span>Once approved, this workspace can be expanded with company profile management, job submissions, and applications for your roles.</span>
                </div>
                <a className="portalButton" href="/">Return to Rowboat website →</a>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
