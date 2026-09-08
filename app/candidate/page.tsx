'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/browser'

type Profile = {
  full_name?: string | null
  company_name?: string | null
  role?: string | null
}

type Application = {
  id: string
  status: string
  created_at: string
  jobs?: {
    title?: string | null
    company?: string | null
    reference_code?: string | null
  } | null
}

export default function CandidatePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        location.href = '/login'
        return
      }

      setEmail(userData.user.email || '')

      const [profileResponse, applicationsResponse] = await Promise.all([
        fetch('/api/profile', { cache: 'no-store' }),
        fetch('/api/applications', { cache: 'no-store' }),
      ])

      const profileBody = await profileResponse.json()
      const applicationsBody = await applicationsResponse.json()

      if (!profileResponse.ok) {
        throw new Error(profileBody.error || 'Unable to load your profile.')
      }

      if (!applicationsResponse.ok) {
        throw new Error(applicationsBody.error || 'Unable to load your applications.')
      }

      const nextProfile = profileBody.profile || {
        full_name: userData.user.user_metadata?.full_name || '',
      }

      setProfile(nextProfile)
      setFullName(nextProfile.full_name || '')
      setApplications(applicationsBody.applications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }),
      })

      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to save your profile.')

      setProfile(body.profile || profile)
      setMessage('Your profile has been saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your profile.')
    } finally {
      setSaving(false)
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
          <a className="portalHeaderLink" href="/opportunities">Browse opportunities</a>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <div className="dashboardWrap">
        <section className="dashboardHero">
          <div>
            <div className="eyebrow">CANDIDATE PORTAL</div>
            <h1>Your opportunities.</h1>
            <p>
              Keep your profile current, browse Rowboat openings, and track the applications you have submitted.
            </p>
          </div>
          <a className="portalButton" href="/opportunities">Browse live openings →</a>
        </section>

        {loading && <div className="portalPanel">Loading your candidate dashboard…</div>}

        {!loading && (
          <>
            {error && <div className="portalMessage error" style={{ marginBottom: 24 }}>{error}</div>}
            {message && <div className="portalMessage" style={{ marginBottom: 24 }}>{message}</div>}

            <div className="portalGrid">
              <section className="portalPanel">
                <div className="panelHeading">
                  <h2>Your profile</h2>
                  <span className="portalBadge approved">Candidate</span>
                </div>

                <form className="portalForm" onSubmit={saveProfile}>
                  <label>
                    Full name
                    <input
                      required
                      value={fullName}
                      onChange={event => setFullName(event.target.value)}
                      placeholder="Your full name"
                    />
                  </label>

                  <label>
                    Email
                    <input value={email} readOnly />
                  </label>

                  <button className="portalButton" type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
              </section>

              <section className="portalPanel">
                <div className="panelHeading">
                  <h2>Next step</h2>
                </div>
                <div className="portalNotice">
                  <strong>Looking for your next opportunity?</strong>
                  <span>Browse the current Rowboat openings and submit an application from the opportunity page.</span>
                </div>
                <a className="portalButton" href="/opportunities">View opportunities →</a>
              </section>
            </div>

            <section className="portalPanel">
              <div className="panelHeading">
                <h2>Your applications</h2>
                <span className="approvalTag">{applications.length} total</span>
              </div>

              {applications.length === 0 ? (
                <div className="portalEmpty">
                  <strong>No applications yet.</strong>
                  <span>When you apply for a Rowboat opening, it will appear here.</span>
                </div>
              ) : (
                <div className="dashboardList">
                  {applications.map(application => (
                    <article key={application.id}>
                      <div>
                        <h3>{application.jobs?.title || 'Rowboat opportunity'}</h3>
                        <p>
                          {application.jobs?.company || 'Rowboat'}
                          {application.jobs?.reference_code ? ` · ${application.jobs.reference_code}` : ''}
                          {' · '}
                          {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`portalBadge ${application.status === 'rejected' ? 'rejected' : application.status === 'hired' || application.status === 'shortlisted' ? 'approved' : 'pending'}`}>
                        {application.status}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
