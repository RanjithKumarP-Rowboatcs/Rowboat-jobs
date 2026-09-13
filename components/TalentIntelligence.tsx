'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/browser'

type Candidate = { candidate_id: string; talent: any; profile: any; score?: number }

const emptyCandidate = {
  full_name: '', email: '', phone: '', location: '', technology: '', primary_skill: '',
  secondary_skills: '', years_experience: '', industry: '', current_company: '',
  previous_companies: '', notice_period_days: '', availability: '', current_compensation: '',
  expected_compensation: '', employment_type: 'Full-time', work_authorization: '',
  certifications: '', projects: '', linkedin_url: '', resume_storage_path: '',
  resume_file_name: '', candidate_status: 'active', source: '', recruiter: '', recruiter_notes: '',
}

export default function TalentIntelligence() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [matches, setMatches] = useState<Candidate[]>([])
  const [search, setSearch] = useState('')
  const [requirement, setRequirement] = useState('Need 5 Senior Data Engineers in Hyderabad who can join within 30 days.')
  const [location, setLocation] = useState('Hyderabad')
  const [skills, setSkills] = useState('Data Engineering, Python, SQL, Spark')
  const [experienceMin, setExperienceMin] = useState('5')
  const [noticeDays, setNoticeDays] = useState('30')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [candidate, setCandidate] = useState(emptyCandidate)
  const [savingCandidate, setSavingCandidate] = useState(false)

  async function load() {
    const response = await fetch(`/api/talent?search=${encodeURIComponent(search)}`, { cache: 'no-store' })
    const body = await response.json()
    if (response.ok) setCandidates(body.candidates || [])
    else setMessage(body.error || 'Unable to load talent database')
  }

  useEffect(() => { load() }, [])

  async function addCandidate(event: React.FormEvent) {
    event.preventDefault()
    setSavingCandidate(true); setMessage('')
    try {
      const response = await fetch('/api/talent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to add candidate')
      setCandidate(emptyCandidate)
      setShowAdd(false)
      setMessage('Candidate added to the talent database.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add candidate')
    } finally { setSavingCandidate(false) }
  }

  function field(key: keyof typeof emptyCandidate, value: string) {
    setCandidate(current => ({ ...current, [key]: value }))
  }

  async function findMatches() {
    setBusy(true); setMessage(''); setMatches([])
    try {
      const supabase = createClient()
      const semantic = await supabase.functions.invoke('talent-search', { body: { query: requirement, threshold: 0.45, limit: 25 } })
      if (!semantic.error && semantic.data?.matches?.length) {
        setMatches(semantic.data.matches)
        setMessage('AI semantic search found relevant profiles. A recruiter must validate every result before contacting or hiring a candidate.')
        return
      }

      const response = await fetch('/api/talent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: requirement, location, skills, experienceMin, noticeDays }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || semantic.error?.message || 'Unable to search candidates')
      setMatches(body.matches || [])
      setMessage('Structured search found relevant profiles. Recruiter review is required before any hiring decision.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to search candidates')
    } finally { setBusy(false) }
  }

  const list = matches.length ? matches : candidates

  return (
    <section className="applicationsList">
      <div className="adminIntro" style={{ marginBottom: 25 }}>
        <div>
          <div className="eyebrow">TALENT INTELLIGENCE</div>
          <h1>Search your talent pool.</h1>
          <p>Store structured candidate intelligence and secure resumes. Search helps recruiters find relevant profiles; humans make hiring decisions.</p>
        </div>
        <button className="adminButton" onClick={() => setShowAdd(true)}>+ Add candidate</button>
      </div>

      {showAdd && (
        <section className="adminForm" style={{ marginBottom: 35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'center' }}>
            <div><div className="eyebrow">TALENT INTAKE</div><h2>Add candidate</h2></div>
            <button type="button" className="adminButton" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
          <p style={{ color: '#667085', fontSize: 13 }}>Enter factual information from the candidate or resume. You can add or update the profile later.</p>
          <form onSubmit={addCandidate}>
            <div className="two">
              <label>Full name *<input required value={candidate.full_name} onChange={e => field('full_name', e.target.value)} /></label>
              <label>Email<input type="email" value={candidate.email} onChange={e => field('email', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Phone<input value={candidate.phone} onChange={e => field('phone', e.target.value)} /></label>
              <label>Location<input value={candidate.location} onChange={e => field('location', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Technology<input placeholder="SAP CPI, Python, Java…" value={candidate.technology} onChange={e => field('technology', e.target.value)} /></label>
              <label>Primary skill<input value={candidate.primary_skill} onChange={e => field('primary_skill', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Secondary skills<input placeholder="Python, SQL, Spark" value={candidate.secondary_skills} onChange={e => field('secondary_skills', e.target.value)} /></label>
              <label>Years of experience<input type="number" min="0" step="0.1" value={candidate.years_experience} onChange={e => field('years_experience', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Industry<input value={candidate.industry} onChange={e => field('industry', e.target.value)} /></label>
              <label>Current company<input value={candidate.current_company} onChange={e => field('current_company', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Previous companies<input value={candidate.previous_companies} onChange={e => field('previous_companies', e.target.value)} /></label>
              <label>Notice period (days)<input type="number" min="0" value={candidate.notice_period_days} onChange={e => field('notice_period_days', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Availability<input placeholder="Immediate / 30 days / date" value={candidate.availability} onChange={e => field('availability', e.target.value)} /></label>
              <label>Employment type<input value={candidate.employment_type} onChange={e => field('employment_type', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Current compensation<input value={candidate.current_compensation} onChange={e => field('current_compensation', e.target.value)} /></label>
              <label>Expected compensation<input value={candidate.expected_compensation} onChange={e => field('expected_compensation', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Work authorization<input value={candidate.work_authorization} onChange={e => field('work_authorization', e.target.value)} /></label>
              <label>Source<input placeholder="Referral / LinkedIn / Database…" value={candidate.source} onChange={e => field('source', e.target.value)} /></label>
            </div>
            <label>Certifications<input value={candidate.certifications} onChange={e => field('certifications', e.target.value)} /></label>
            <label>Projects<textarea rows={3} value={candidate.projects} onChange={e => field('projects', e.target.value)} /></label>
            <div className="two">
              <label>LinkedIn URL<input value={candidate.linkedin_url} onChange={e => field('linkedin_url', e.target.value)} /></label>
              <label>Recruiter<input value={candidate.recruiter} onChange={e => field('recruiter', e.target.value)} /></label>
            </div>
            <label>Resume storage path (optional)<input placeholder="candidate-resumes/talent-pool/..." value={candidate.resume_storage_path} onChange={e => field('resume_storage_path', e.target.value)} /></label>
            <label>Recruiter notes<textarea rows={3} value={candidate.recruiter_notes} onChange={e => field('recruiter_notes', e.target.value)} /></label>
            <button className="adminButton" type="submit" disabled={savingCandidate}>{savingCandidate ? 'Saving…' : 'Save candidate'}</button>
          </form>
        </section>
      )}

      <div className="adminGrid" style={{ marginBottom: 35 }}>
        <section className="adminForm">
          <h2>Requirement search</h2>
          <label>Requirement<textarea rows={4} value={requirement} onChange={e => setRequirement(e.target.value)} /></label>
          <div className="two">
            <label>Location<input value={location} onChange={e => setLocation(e.target.value)} /></label>
            <label>Minimum experience<input type="number" min="0" value={experienceMin} onChange={e => setExperienceMin(e.target.value)} /></label>
          </div>
          <div className="two">
            <label>Skills<input value={skills} onChange={e => setSkills(e.target.value)} /></label>
            <label>Maximum notice days<input type="number" min="0" value={noticeDays} onChange={e => setNoticeDays(e.target.value)} /></label>
          </div>
          <button className="adminButton" onClick={findMatches} disabled={busy}>{busy ? 'Searching…' : 'Search relevant candidates →'}</button>
          {message && <div className="adminMessage">{message}</div>}
        </section>
        <section className="adminList">
          <h2>Talent database</h2>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') load() }} placeholder="Search name, skill, company, location…" />
          <button className="adminButton" style={{ marginTop: 12 }} onClick={load}>Search candidates →</button>
          <p style={{ color: '#667085', fontSize: 12 }}>{candidates.length} candidate profile{candidates.length === 1 ? '' : 's'} available.</p>
        </section>
      </div>

      <h2>{matches.length ? 'Relevant candidates' : 'Candidates'}</h2>
      {list.length === 0 ? <p>No candidate profiles are available yet. Use <strong>+ Add candidate</strong> to start building the database.</p> : (
        <div className="dashboardList">
          {list.map(candidate => {
            const p = candidate.profile || {}
            const t = candidate.talent || {}
            return (
              <article key={candidate.candidate_id} className="applicationRow">
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      <h3>{p.full_name || 'Unnamed candidate'}</h3>
                      <p>{t.primary_skill || p.headline || 'Candidate'} · {p.location || 'Location not provided'} · {p.experience_years ?? '—'} years</p>
                    </div>
                    {p.resume_url && <a href={p.resume_url.startsWith('storage:') ? `/api/resumes?path=${encodeURIComponent(p.resume_url)}` : p.resume_url} target="_blank" rel="noreferrer">Open resume ↗</a>}
                  </div>
                  <p><strong>Technology:</strong> {t.technology || 'Not yet profiled'} · <strong>Industry:</strong> {t.industry || 'Not yet profiled'} · <strong>Notice:</strong> {p.immediate_joiner ? 'Immediate' : p.notice_period_days != null ? `${p.notice_period_days} days` : 'Unknown'}</p>
                  <p><strong>Skills:</strong> {(t.secondary_skills || []).join(', ') || 'Not yet profiled'}</p>
                  <p><strong>Certifications:</strong> {(t.certifications || []).join(', ') || 'Not yet profiled'}</p>
                  {t.ai_generated_skill_profile && <p><strong>Profile summary:</strong> {t.ai_generated_skill_profile}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
