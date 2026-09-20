'use client'

import { FormEvent, useEffect, useState } from 'react'
import RowboatLogo from '../../components/RowboatLogo'
import { createClient } from '../../lib/supabase/browser'
import ResumeUpload from '../../components/ResumeUpload'

type Application = { id: string; status: string; created_at: string; jobs?: { title?: string; company?: string; reference_code?: string; status?: string } }
type Profile = { full_name?: string; phone?: string; resume_url?: string; linkedin_url?: string; location?: string; preferred_location?: string; experience_years?: number; notice_period_days?: number; current_ctc?: number; expected_ctc?: number; current_company?: string; date_of_birth?: string; pan_number?: string; pf_active_all_employments?: boolean; highest_education_qualification?: string; highest_education_year?: number }
type Talent = { technology?: string; primary_skill?: string; secondary_skills?: string[]; industry?: string; previous_companies?: string[]; employment_type?: string; work_authorization?: string; certifications?: string[]; projects?: string[]; availability?: string }

export default function CandidatePage() {
  const [profile, setProfile] = useState<Profile>({})
  const [talent, setTalent] = useState<Talent>({})
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
    setTalent(meBody.talent || {})
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
    const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, ...talent, email }) })
    const body = await response.json()
    if (!response.ok) setError(body.error || 'Unable to save profile')
    else { setProfile(body.profile); setTalent(body.talent || talent); setMessage('Profile and talent information updated.') }
  }

  async function handleResumeUploaded(value: string) {
    setError('')
    setProfile(current => ({ ...current, resume_url: value }))
    const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, ...talent, resume_url: value, email }) })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || 'Resume uploaded, but the profile could not be updated.')
    setProfile(body.profile)
    setTalent(body.talent || talent)
    setMessage('Resume uploaded and saved to your profile.')
  }

  async function signOut() { const supabase = createClient(); await supabase.auth.signOut(); location.href = '/' }

  return <main className="portalShell"><header className="portalHeader"><a href="/"><RowboatLogo /></a><div><a className="portalHeaderLink" href="/opportunities">Browse jobs</a><button onClick={signOut}>Sign out</button></div></header><section className="dashboardWrap"><div className="dashboardHero"><div><div className="eyebrow">CANDIDATE PORTAL</div><h1>Your opportunities.</h1><p>Keep your profile ready, browse live openings and track applications from one place.</p></div><a className="portalButton small" href="/opportunities">Find jobs →</a></div>{loading ? <div className="portalPanel"><h2>Loading…</h2></div> : <div className="portalGrid"><section className="portalPanel"><h2>Your talent profile</h2><p className="fieldHint">This information helps Rowboat recruiters identify you for suitable opportunities. You control what you provide.</p><form className="portalForm" onSubmit={save}><label>Full name<input value={profile.full_name || ''} onChange={e => setProfile({ ...profile, full_name: e.target.value })} /></label><label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><small className="fieldHint">Changing the login email may require confirmation in the new mailbox.</small><label>Phone<input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label><div className="two"><label>Current location<input value={profile.location || ''} onChange={e => setProfile({ ...profile, location: e.target.value })} /></label><label>Preferred location<input value={profile.preferred_location || ''} onChange={e => setProfile({ ...profile, preferred_location: e.target.value })} placeholder="Hyderabad / Bengaluru / Remote…" /></label></div><div className="two"><label>Years of experience<input type="number" min="0" step="0.5" value={profile.experience_years ?? ''} onChange={e => setProfile({ ...profile, experience_years: Number(e.target.value) || undefined })} /></label></div><label>Current employer<input value={profile.current_company || ''} onChange={e => setProfile({ ...profile, current_company: e.target.value })} /></label><label>Technology<input value={talent.technology || ''} onChange={e => setTalent({ ...talent, technology: e.target.value })} placeholder="Python, SAP, AWS, Data Engineering…" /></label><label>Primary skill<input value={talent.primary_skill || ''} onChange={e => setTalent({ ...talent, primary_skill: e.target.value })} placeholder="Senior Data Engineer" /></label><label>Secondary skills<input value={(talent.secondary_skills || []).join(', ')} onChange={e => setTalent({ ...talent, secondary_skills: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} placeholder="Spark, SQL, Databricks" /></label><div className="two"><label>Industry<input value={talent.industry || ''} onChange={e => setTalent({ ...talent, industry: e.target.value })} /></label><label>Employment type<input value={talent.employment_type || ''} onChange={e => setTalent({ ...talent, employment_type: e.target.value })} placeholder="Full-time" /></label></div><label>Previous companies<input value={(talent.previous_companies || []).join(', ')} onChange={e => setTalent({ ...talent, previous_companies: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} /></label><label>Certifications<input value={(talent.certifications || []).join(', ')} onChange={e => setTalent({ ...talent, certifications: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} placeholder="AWS, Databricks…" /></label><label>Projects<textarea rows={4} value={(talent.projects || []).join('\n')} onChange={e => setTalent({ ...talent, projects: e.target.value.split('\n').map(v => v.trim()).filter(Boolean) })} placeholder="One project per line" /></label><div className="two"><label>Current CTC<input type="number" min="0" step="0.01" value={profile.current_ctc ?? ''} onChange={e => setProfile({ ...profile, current_ctc: e.target.value === '' ? undefined : Number(e.target.value) })} /></label><label>Expected CTC<input type="number" min="0" step="0.01" value={profile.expected_ctc ?? ''} onChange={e => setProfile({ ...profile, expected_ctc: e.target.value === '' ? undefined : Number(e.target.value) })} /></label></div><div className="two"><label>Notice period (days)<input type="number" min="0" value={profile.notice_period_days ?? ''} onChange={e => setProfile({ ...profile, notice_period_days: Number(e.target.value) || undefined })} /></label><label>Availability<input value={talent.availability || ''} onChange={e => setTalent({ ...talent, availability: e.target.value })} placeholder="Immediate / 30 days / 15 Sep" /></label></div><label>Date of birth<input type="date" value={profile.date_of_birth || ''} onChange={e => setProfile({ ...profile, date_of_birth: e.target.value })} /></label><label>PAN details<input value={profile.pan_number || ''} onChange={e => setProfile({ ...profile, pan_number: e.target.value.toUpperCase() })} maxLength={10} /></label><label>PF active with all employment?<select value={profile.pf_active_all_employments == null ? '' : profile.pf_active_all_employments ? 'yes' : 'no'} onChange={e => setProfile({ ...profile, pf_active_all_employments: e.target.value === '' ? undefined : e.target.value === 'yes' })}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></select></label><div className="two"><label>Highest education qualification<input value={profile.highest_education_qualification || ''} onChange={e => setProfile({ ...profile, highest_education_qualification: e.target.value })} /></label><label>Year of passing<input type="number" min="1900" max="2100" value={profile.highest_education_year ?? ''} onChange={e => setProfile({ ...profile, highest_education_year: e.target.value === '' ? undefined : Number(e.target.value) })} /></label></div><label>Work authorization<input value={talent.work_authorization || ''} onChange={e => setTalent({ ...talent, work_authorization: e.target.value })} placeholder="India / US / EU…" /></label><label>Resume link<input value={profile.resume_url?.startsWith('storage:') ? '' : (profile.resume_url || '')} onChange={e => setProfile({ ...profile, resume_url: e.target.value })} placeholder="Google Drive / OneDrive / URL" /></label><ResumeUpload value={profile.resume_url} onUploaded={handleResumeUploaded}/>{profile.resume_url && <a className="resumeOpenLink" href={profile.resume_url.startsWith('storage:') ? `/api/resumes?path=${encodeURIComponent(profile.resume_url)}` : profile.resume_url} target="_blank" rel="noreferrer">Open current resume ↗</a>}<label>LinkedIn<input value={profile.linkedin_url || ''} onChange={e => setProfile({ ...profile, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." /></label>{error && <div className="portalMessage error">{error}</div>}{message && <div className="portalMessage">{message}</div>}<button className="portalButton">Save profile →</button></form></section><section className="portalPanel"><h2>Your applications</h2>{applications.length === 0 ? <div className="portalEmpty"><strong>No applications yet.</strong><span>Browse current opportunities and apply when you find the right fit.</span><a className="portalButton small" href="/opportunities">Browse opportunities →</a></div> : <div className="dashboardList">{applications.map(app => <article key={app.id}><div><span className={`status ${app.status}`}>{app.status}</span><h3>{app.jobs?.title || 'Opportunity'}</h3><p>{app.jobs?.company || 'Rowboat opportunity'} · {app.jobs?.reference_code || 'No reference'} · {new Date(app.created_at).toLocaleDateString()}</p></div></article>)}</div>}</section></div>}</section></main>
}
