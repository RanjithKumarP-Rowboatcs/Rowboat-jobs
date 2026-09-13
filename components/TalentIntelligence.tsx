'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/browser'

type Candidate = { candidate_id: string; talent: any; profile: any; score?: number }

type ExtractedResume = {
  fullName?: string; email?: string; phone?: string; location?: string; currentCompany?: string;
  experienceYears?: number; noticePeriodDays?: number; technology?: string; primarySkill?: string;
  secondarySkills: string[]; industry?: string; previousCompanies: string[]; certifications: string[];
  projects: string[]; linkedinUrl?: string; currentCompensation?: number; expectedCompensation?: number;
  education: string[]; aiSummary: string; text?: string
}

const emptyCandidate = {
  full_name: '', email: '', phone: '', location: '', technology: '', primary_skill: '', secondary_skills: '',
  years_experience: '', industry: '', current_company: '', previous_companies: '', notice_period_days: '', availability: '',
  current_compensation: '', expected_compensation: '', employment_type: '', work_authorization: '', certifications: '',
  projects: '', linkedin_url: '', candidate_status: 'active', source: 'Resume upload', recruiter: '', recruiter_notes: '', education: '',
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
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [savingCandidate, setSavingCandidate] = useState(false)
  const [parsed, setParsed] = useState(false)

  async function load() {
    const response = await fetch(`/api/talent?search=${encodeURIComponent(search)}`, { cache: 'no-store' })
    const body = await response.json()
    if (response.ok) setCandidates(body.candidates || [])
    else setMessage(body.error || 'Unable to load talent database')
  }

  useEffect(() => { load() }, [])

  function field(key: keyof typeof emptyCandidate, value: string) {
    setCandidate(current => ({ ...current, [key]: value }))
  }

  function applyExtracted(data: ExtractedResume) {
    setCandidate(current => ({
      ...current,
      full_name: data.fullName || '', email: data.email || '', phone: data.phone || '', location: data.location || '',
      technology: data.technology || '', primary_skill: data.primarySkill || '', secondary_skills: (data.secondarySkills || []).join(', '),
      years_experience: data.experienceYears != null ? String(data.experienceYears) : '', industry: data.industry || '',
      current_company: data.currentCompany || '', previous_companies: (data.previousCompanies || []).join(', '),
      notice_period_days: data.noticePeriodDays != null ? String(data.noticePeriodDays) : '',
      availability: data.noticePeriodDays === 0 ? 'Immediate' : data.noticePeriodDays != null ? `${data.noticePeriodDays} days` : '',
      current_compensation: data.currentCompensation != null ? String(data.currentCompensation) : '',
      expected_compensation: data.expectedCompensation != null ? String(data.expectedCompensation) : '',
      certifications: (data.certifications || []).join(', '), projects: (data.projects || []).join('\n'),
      linkedin_url: data.linkedinUrl || '', education: (data.education || []).join('\n'),
    }))
  }

  async function inspectResume(file: File | null) {
    setResumeFile(file)
    setParsed(false)
    if (!file) return
    setParsing(true); setMessage('Reading the resume and extracting available details…')
    try {
      const form = new FormData()
      form.append('resume', file)
      form.append('preview', 'true')
      const response = await fetch('/api/talent', { method: 'PUT', body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to read resume')
      applyExtracted(body.extracted)
      setParsed(true)
      setMessage('Resume read successfully. The fields below were populated from the resume. Please review them and then save.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to read resume')
    } finally { setParsing(false) }
  }

  async function saveCandidate(event: React.FormEvent) {
    event.preventDefault()
    if (!resumeFile) { setMessage('Please upload a resume first.'); return }
    setSavingCandidate(true); setMessage('Saving the resume and extracted candidate profile…')
    try {
      const form = new FormData()
      form.append('resume', resumeFile)
      form.append('source', candidate.source)
      form.append('recruiter', candidate.recruiter)
      form.append('recruiter_notes', candidate.recruiter_notes)
      // These values allow a recruiter to correct any extraction before the final save.
      for (const [key, value] of Object.entries(candidate)) form.append(key, value)
      const response = await fetch('/api/talent', { method: 'PUT', body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to save candidate')
      setCandidate(emptyCandidate); setResumeFile(null); setParsed(false); setShowAdd(false)
      setMessage('Candidate saved. Resume and extracted profile are now in the talent database.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save candidate')
    } finally { setSavingCandidate(false) }
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
      const response = await fetch('/api/talent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: requirement, location, skills, experienceMin, noticeDays }) })
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
          <p>Upload a resume once. The system extracts the factual candidate information it can read, shows it for review, and saves the resume and profile together.</p>
        </div>
        <button className="adminButton" onClick={() => setShowAdd(true)}>+ Add candidate</button>
      </div>

      {showAdd && (
        <section className="adminForm" style={{ marginBottom: 35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'center' }}>
            <div><div className="eyebrow">RESUME-FIRST TALENT INTAKE</div><h2>Add candidate from resume</h2></div>
            <button type="button" className="adminButton" onClick={() => { setShowAdd(false); setResumeFile(null); setParsed(false) }}>Cancel</button>
          </div>
          <p style={{ color: '#667085', fontSize: 13 }}>Upload PDF, DOCX or DOC up to 10 MB. The resume is read first; extracted fields appear below before anything is saved.</p>
          <label style={{ display: 'block', padding: 18, border: '1px dashed #98A2B3', borderRadius: 12, marginBottom: 20 }}>
            <strong>Resume *</strong>
            <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => inspectResume(e.target.files?.[0] || null)} style={{ display: 'block', marginTop: 10 }} />
            {resumeFile && <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#667085' }}>{resumeFile.name} · {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span>}
          </label>
          {parsing && <div className="adminMessage">Reading resume…</div>}
          {parsed && !parsing && <div className="adminMessage">✓ Extracted information is ready below. Review and correct anything needed, then click Save candidate.</div>}

          <form onSubmit={saveCandidate}>
            <h3 style={{ marginTop: 20 }}>Extracted candidate information</h3>
            <div className="two">
              <label>Full name *<input required value={candidate.full_name} onChange={e => field('full_name', e.target.value)} /></label>
              <label>Email<input type="email" value={candidate.email} onChange={e => field('email', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Phone<input value={candidate.phone} onChange={e => field('phone', e.target.value)} /></label>
              <label>Location<input value={candidate.location} onChange={e => field('location', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Technology<input value={candidate.technology} onChange={e => field('technology', e.target.value)} /></label>
              <label>Primary skill<input value={candidate.primary_skill} onChange={e => field('primary_skill', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Secondary skills<input value={candidate.secondary_skills} onChange={e => field('secondary_skills', e.target.value)} /></label>
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
              <label>Availability<input value={candidate.availability} onChange={e => field('availability', e.target.value)} /></label>
              <label>Employment type<input value={candidate.employment_type} onChange={e => field('employment_type', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Current compensation<input value={candidate.current_compensation} onChange={e => field('current_compensation', e.target.value)} /></label>
              <label>Expected compensation<input value={candidate.expected_compensation} onChange={e => field('expected_compensation', e.target.value)} /></label>
            </div>
            <div className="two">
              <label>Work authorization<input value={candidate.work_authorization} onChange={e => field('work_authorization', e.target.value)} /></label>
              <label>LinkedIn URL<input value={candidate.linkedin_url} onChange={e => field('linkedin_url', e.target.value)} /></label>
            </div>
            <label>Certifications<input value={candidate.certifications} onChange={e => field('certifications', e.target.value)} /></label>
            <label>Education<textarea rows={3} value={candidate.education} onChange={e => field('education', e.target.value)} /></label>
            <label>Projects<textarea rows={4} value={candidate.projects} onChange={e => field('projects', e.target.value)} /></label>
            <div className="two">
              <label>Recruiter<input value={candidate.recruiter} onChange={e => field('recruiter', e.target.value)} /></label>
              <label>Source<input value={candidate.source} onChange={e => field('source', e.target.value)} /></label>
            </div>
            <label>Recruiter notes<textarea rows={3} value={candidate.recruiter_notes} onChange={e => field('recruiter_notes', e.target.value)} /></label>
            <button className="adminButton" type="submit" disabled={savingCandidate || parsing || !parsed}>{savingCandidate ? 'Saving…' : 'Save candidate + resume'}</button>
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
                    <div><h3>{p.full_name || 'Unnamed candidate'}</h3><p>{t.primary_skill || p.headline || 'Candidate'} · {p.location || 'Location not provided'} · {p.experience_years ?? '—'} years</p></div>
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
