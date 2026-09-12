'use client'

import { useEffect, useState } from 'react'

type Candidate = { candidate_id: string; talent: any; profile: any; score?: number }

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

  async function load() {
    const response = await fetch(`/api/talent?search=${encodeURIComponent(search)}`, { cache: 'no-store' })
    const body = await response.json()
    if (response.ok) setCandidates(body.candidates || [])
    else setMessage(body.error || 'Unable to load talent database')
  }

  useEffect(() => { load() }, [])

  async function findMatches() {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/talent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: requirement,
          location,
          skills,
          experienceMin,
          noticeDays,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to calculate matches')
      setMatches(body.matches || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to calculate matches')
    } finally { setBusy(false) }
  }

  const list = matches.length ? matches : candidates

  return (
    <section className="applicationsList">
      <div className="adminIntro" style={{ marginBottom: 25 }}>
        <div>
          <div className="eyebrow">TALENT INTELLIGENCE</div>
          <h1>Search your talent pool.</h1>
          <p>Store structured candidate intelligence, search resumes and rank candidates against new requirements. Recruiters validate every result.</p>
        </div>
      </div>

      <div className="adminGrid" style={{ marginBottom: 35 }}>
        <section className="adminForm">
          <h2>Requirement matcher</h2>
          <label>Requirement<textarea rows={4} value={requirement} onChange={e => setRequirement(e.target.value)} /></label>
          <div className="two">
            <label>Location<input value={location} onChange={e => setLocation(e.target.value)} /></label>
            <label>Minimum experience<input type="number" min="0" value={experienceMin} onChange={e => setExperienceMin(e.target.value)} /></label>
          </div>
          <div className="two">
            <label>Skills<input value={skills} onChange={e => setSkills(e.target.value)} /></label>
            <label>Maximum notice days<input type="number" min="0" value={noticeDays} onChange={e => setNoticeDays(e.target.value)} /></label>
          </div>
          <button className="adminButton" onClick={findMatches} disabled={busy}>{busy ? 'Matching…' : 'Find best matches →'}</button>
          {message && <div className="adminMessage">{message}</div>}
        </section>
        <section className="adminList">
          <h2>Talent database</h2>
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') load() }} placeholder="Search name, skill, company, location…" />
          <button className="adminButton" style={{ marginTop: 12 }} onClick={load}>Search candidates →</button>
          <p style={{ color: '#667085', fontSize: 12 }}>{candidates.length} candidate profile{candidates.length === 1 ? '' : 's'} indexed.</p>
        </section>
      </div>

      <h2>{matches.length ? 'Recommended candidates' : 'Candidates'}</h2>
      {list.length === 0 ? <p>No candidate profiles are available yet. Candidate accounts will appear here as their profiles are created.</p> : (
        <div className="dashboardList">
          {list.map(candidate => {
            const p = candidate.profile || {}
            const t = candidate.talent || {}
            return (
              <article key={candidate.candidate_id} className="applicationRow">
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      {candidate.score != null && <span className="status shortlisted">{candidate.score}% match</span>}
                      <h3>{p.full_name || 'Unnamed candidate'}</h3>
                      <p>{t.primary_skill || p.headline || 'Candidate'} · {p.location || 'Location not provided'} · {p.experience_years ?? '—'} years</p>
                    </div>
                    {p.resume_url && <a href={p.resume_url.startsWith('storage:') ? `/api/resumes?path=${encodeURIComponent(p.resume_url)}` : p.resume_url} target="_blank" rel="noreferrer">Open resume ↗</a>}
                  </div>
                  <p><strong>Technology:</strong> {t.technology || 'Not yet profiled'} · <strong>Industry:</strong> {t.industry || 'Not yet profiled'} · <strong>Notice:</strong> {p.immediate_joiner ? 'Immediate' : p.notice_period_days != null ? `${p.notice_period_days} days` : 'Unknown'}</p>
                  <p><strong>Skills:</strong> {(t.secondary_skills || []).join(', ') || 'Not yet profiled'}</p>
                  <p><strong>Certifications:</strong> {(t.certifications || []).join(', ') || 'Not yet profiled'}</p>
                  {t.ai_generated_skill_profile && <p><strong>AI profile:</strong> {t.ai_generated_skill_profile}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
