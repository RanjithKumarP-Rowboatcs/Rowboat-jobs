'use client'

import { FormEvent, useEffect, useState } from 'react'
import RowboatLogo from '../../../components/RowboatLogo'
import { createClient } from '../../lib/supabase/browser'
import ResumeUpload from '../../components/ResumeUpload'

type Application = { id: string; status: string; created_at: string; jobs?: { title?: string; company?: string; reference_code?: string; status?: string } }
type Profile = { full_name?: string; phone?: string; resume_url?: string; linkedin_url?: string }

export default function CandidatePage() {
  const [profile, setProfile] = useState<Profile>({})
  const [applications, setApplications] = useState<Application[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  async function load() {
    setLoading(true); setError('')
    const me = await fetch('/api/profile', { cache: 'no-store' })
    const meBody = await me.json()
    if (!me.ok) { location.href = '/login'; return }
    if (meBody.role !== 'candidate') { location.href = meBody.role === 'employer' ? '/employer' : '/admin'; return }
    setProfile(meBody.profile || {})
    setEmail(meBody.user?.email || '')
    const apps = await fetch('/api/applications?mine=1', { cache: 'no-store' })
    const appsBody = await apps.json()
    if (!apps.ok) setError(appsBody.error || 'Unable to load applications')
    else setApplications(appsBody.applications || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save(event: FormEvent) {
    event.preventDefault(); setMessage(''); setError('')
    const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, email }) })
    const body = await response.json()
    if (!response.ok) setError(body.error || 'Unable to save profile')
    else { setProfile(body.profile); setMessage('Profile updated.') }
  }

  async function handleResumeUploaded(value: string) {
    setError('')
    setProfile(current => ({ ...current, resume_url: value }))
    const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, resume_url: value, email }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Resume uploaded, but the profile could not be updated.')
    setProfile(body.profile)
    setMessage('Resume uploaded and saved to your profile.')
  }

  async function signOut() { const supabase = createClient(); await supabase.auth.signOut(); location.href = '/' }

  return <main className="portalShell"><header className="portalHeader"><a href="/"><RowboatLogo /></a><div><a className="portalHeaderLink" href="/opportunities">Browse jobs</a><button onClick={signOut}>Sign out</button></div></header><section className="dashboardWrap"><div className="dashboardHero"><div><div className="eyebrow">CANDIDATE PORTAL</div><h1>Your opportunities.</h1><p>Keep your profile ready, browse live openings and track applications from one place.</p></div><a className="portalButton small" href="/opportunities">Find jobs →</a></div>{loading ? <div className="portalPanel"><h2>Loading…</h2></div> : <div className="portalGrid"><section className="portalPanel"><h2>Your profile</h2><form className="portalForm" onSubmit={save}><label>Full name<input value={profile.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></label><label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><small className="fieldHint">Changing the login email may require confirmation in the new mailbox.</small><label>Phone<input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label><label>Resume link<input value={profile.resume_url?.startsWith('storage:') ? '' : (profile.resume_url || '')} onChange={e => setProfile({ ...profile, resume_url: e.target.value })} placeholder="Google Drive / OneDrive / URL" /></label><ResumeUpload value={profile.resume_url} onUploaded={handleResumeUploaded}/>{profile.resume_url && <a className="resumeOpenLink" href={profile.resume_url.startsWith('storage:') ? `/api/resumes?path=${encodeURIComponent(profile.resume_url)}` : profile.resume_url} target="_blank" rel="noreferrer">Open current resume ↗</a>}<label>LinkedIn<input value={profile.linkedin_url || ''} onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." /></label>{error && <div className="portalMessage error">{error}</div>}{message && <div className="portalMessage">{message}</div>}<button className="portalButton">Save profile →</button></form></section><section className="portalPanel"><h2>Your applications</h2>{applications.length === 0 ? <div className="portalEmpty"><strong>No applications yet.</strong><span>Browse current opportunities and apply when you find the right fit.</span><a className="portalButton small" href="/opportunities">Browse opportunities →</a></div> : <div className="dashboardList">{applications.map(app => <article key={app.id}><div><span className={`status ${app.status}`}>{app.status}</span><h3>{app.jobs?.title || 'Opportunity'}</h3><p>{app.jobs?.company || 'Rowboat opportunity'} · {app.jobs?.reference_code || 'No reference'} · {new Date(app.created_at).toLocaleDateString()}</p></div></article>)}</div>}</section></div>}</section></main>
}
