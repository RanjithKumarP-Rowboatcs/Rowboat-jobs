'use client'

import { FormEvent, useEffect, useState } from 'react'

type Candidate = { candidate_id: string; talent: any; profile: any; score?: number }

type ExtractedResume = {
  fullName?: string; email?: string; phone?: string; location?: string; currentCompany?: string; currentRole?: string
  experienceYears?: number; relevantExperienceYears?: number; noticePeriodDays?: number; technology?: string; primarySkill?: string
  secondarySkills?: string[]; industry?: string; previousCompanies?: string[]; certifications?: string[]; projects?: string[]; linkedinUrl?: string
  currentCompensation?: number; expectedCompensation?: number; employmentType?: string; workAuthorization?: string
  education?: string[]; technicalResponsibilities?: string[]; managementResponsibilities?: string[]; achievements?: string[]; aiSummary?: string; text?: string
}

const emptyCandidate = {
  full_name: '', email: '', phone: '', location: '', technology: '', primary_skill: '', secondary_skills: '', years_experience: '', relevant_experience_years: '',
  industry: '', current_company: '', current_role: '', previous_companies: '', notice_period_days: '', availability: '', current_compensation: '', expected_compensation: '',
  employment_type: '', work_authorization: '', certifications: '', projects: '', linkedin_url: '', education: '', technical_responsibilities: '', management_responsibilities: '',
  achievements: '', candidate_status: 'active', source: 'Resume upload', recruiter: '', recruiter_notes: '',
}

const fieldLabels: Array<[keyof typeof emptyCandidate, string]> = [
  ['full_name', 'Full name *'], ['email', 'Email'], ['phone', 'Phone'], ['location', 'Location'], ['technology', 'Technology'], ['primary_skill', 'Primary skill'],
  ['secondary_skills', 'Secondary skills'], ['years_experience', 'Total experience (years)'], ['relevant_experience_years', 'Relevant experience (years)'], ['industry', 'Industry'],
  ['current_company', 'Current company'], ['current_role', 'Current role / designation'], ['previous_companies', 'Previous companies'], ['notice_period_days', 'Notice period (days)'],
  ['availability', 'Availability'], ['employment_type', 'Employment type'], ['current_compensation', 'Current compensation'], ['expected_compensation', 'Expected compensation'],
  ['work_authorization', 'Work authorization'], ['linkedin_url', 'LinkedIn URL'],
]

export default function TalentDatabase() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [matches, setMatches] = useState<Candidate[]>([])
  const [search, setSearch] = useState('')
  const [requirement, setRequirement] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [experienceMin, setExperienceMin] = useState('')
  const [noticeDays, setNoticeDays] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [candidate, setCandidate] = useState(emptyCandidate)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load(query = search) {
    setBusy(true)
    try {
      const response = await fetch(`/api/talent-pool?search=${encodeURIComponent(query)}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load talent database')
      setCandidates(body.candidates || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load talent database')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { load() }, [])

  function setField(key: keyof typeof emptyCandidate, value: string) {
    setCandidate(current => ({ ...current, [key]: value }))
  }

  function applyExtracted(data: ExtractedResume) {
    setCandidate(current => ({
      ...current,
      full_name: data.fullName || '', email: data.email || '', phone: data.phone || '', location: data.location || '', technology: data.technology || '', primary_skill: data.primarySkill || '',
      secondary_skills: (data.secondarySkills || []).join(', '), years_experience: data.experienceYears != null ? String(data.experienceYears) : '',
      relevant_experience_years: data.relevantExperienceYears != null ? String(data.relevantExperienceYears) : '', industry: data.industry || '', current_company: data.currentCompany || '',
      current_role: data.currentRole || '', previous_companies: (data.previousCompanies || []).join(', '), notice_period_days: data.noticePeriodDays != null ? String(data.noticePeriodDays) : '',
      availability: data.noticePeriodDays === 0 ? 'Immediate' : data.noticePeriodDays != null ? `${data.noticePeriodDays} days` : '',
      current_compensation: data.currentCompensation != null ? String(data.currentCompensation) : '', expected_compensation: data.expectedCompensation != null ? String(data.expectedCompensation) : '',
      employment_type: data.employmentType || '', work_authorization: data.workAuthorization || '', certifications: (data.certifications || []).join(', '), projects: (data.projects || []).join('\n'),
      linkedin_url: data.linkedinUrl || '', education: (data.education || []).join('\n'), technical_responsibilities: (data.technicalResponsibilities || []).join('\n'),
      management_responsibilities: (data.managementResponsibilities || []).join('\n'), achievements: (data.achievements || []).join('\n'),
    }))
  }

  async function inspectResume(file: File | null) {
    setResumeFile(file)
    setParsed(false)
    if (!file) return
    setParsing(true)
    setMessage('Reading the resume and extracting candidate information…')
    try {
      const form = new FormData()
      form.append('resume', file)
      form.append('preview', 'true')
      const response = await fetch('/api/talent', { method: 'PUT', body: form, cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to read resume')
      applyExtracted(body.extracted || {})
      setParsed(true)
      setMessage('Resume read successfully. Review or correct the fields, then save the profile.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to read resume')
    } finally {
      setParsing(false)
    }
  }

  async function saveCandidate(event: FormEvent) {
    event.preventDefault()
    if (!resumeFile) { setMessage('Please upload a resume first.'); return }
    if (!candidate.full_name.trim()) { setMessage('Full name is required.'); return }
    setSaving(true)
    setMessage('Saving profile and resume…')
    try {
      const form = new FormData()
      form.append('resume', resumeFile)
      for (const [key, value] of Object.entries(candidate)) form.append(key, value)
      const response = await fetch('/api/talent', { method: 'PUT', body: form })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to save candidate')
      setCandidate({ ...emptyCandidate })
      setResumeFile(null)
      setParsed(false)
      setShowAdd(false)
      setMessage('Candidate saved in the Talent Database.')
      await load('')
      setSearch('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save candidate')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCandidate(item: Candidate) {
    const name = item.profile?.full_name || 'this candidate'
    if (!window.confirm(`Permanently delete ${name}? This removes the database profile and stored resume. This action cannot be undone.`)) return
    setDeletingId(item.candidate_id)
    setMessage('Deleting profile and stored resume…')
    try {
      const response = await fetch('/api/talent-pool', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidate_id: item.candidate_id }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to delete candidate')
      setMessage(body.warning || `${name} was permanently deleted.`)
      setCandidates(current => current.filter(candidate => candidate.candidate_id !== item.candidate_id))
      setMatches(current => current.filter(candidate => candidate.candidate_id !== item.candidate_id))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete candidate')
    } finally {
      setDeletingId(null)
    }
  }

  async function searchCandidates(event?: FormEvent) {
    event?.preventDefault()
    await load(search)
    setMatches([])
  }

  async function findMatches(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('Searching the current Talent Database with exact filters…')
    try {
      const response = await fetch('/api/talent-pool/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement, location, skills, experienceMin, noticeDays, limit: 50 }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to search candidates')
      setMatches(body.matches || [])
      setMessage(body.matches?.length ? 'Exact Talent Database matches found. Recruiter review is required.' : 'No candidates matched every requirement. No unrelated profiles were added.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to search candidates')
      setMatches([])
    } finally {
      setBusy(false)
    }
  }

  const list = matches.length ? matches : candidates

  return (
    <section className="applicationsList">
      <div className="adminIntro" style={{ marginBottom: 25 }}>
        <div>
          <div className="eyebrow">PRIVATE TALENT DATABASE</div>
          <h1>Set up candidate profiles properly.</h1>
          <p>Admin and Recruiter users can upload a resume, review every extracted field, save the profile, search the active database and permanently delete unwanted profiles.</p>
        </div>
        <button className="adminButton" type="button" onClick={() => { setShowAdd(true); setMessage('') }}>+ Add candidate</button>
      </div>

      {showAdd && (
        <section className="adminForm" style={{ marginBottom: 35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15 }}>
            <div><div className="eyebrow">RESUME-FIRST INTAKE</div><h2>Add candidate</h2></div>
            <button type="button" className="adminButton" onClick={() => { setShowAdd(false); setResumeFile(null); setParsed(false) }}>Cancel</button>
          </div>
          <p style={{ color: '#667085', fontSize: 13 }}>PDF, DOC or DOCX up to 10 MB. Nothing is saved until you review the extracted information and press Save.</p>
          <label style={{ display: 'block', padding: 18, border: '1px dashed #98A2B3', borderRadius: 12, marginBottom: 20 }}>
            <strong>Resume *</strong>
            <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => inspectResume(e.target.files?.[0] || null)} style={{ display: 'block', marginTop: 10 }} />
            {resumeFile && <span style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#667085' }}>{resumeFile.name} · {(resumeFile.size / 1024 / 1024).toFixed(2)} MB</span>}
          </label>
          {parsing && <div className="adminMessage">Reading resume…</div>}
          {message && <div className="adminMessage">{message}</div>}

          <form onSubmit={saveCandidate}>
            <h3>Candidate information</h3>
            <div className="two">
              {fieldLabels.slice(0, 4).map(([key, label]) => <label key={key}>{label}<input required={key === 'full_name'} type={key === 'email' ? 'email' : 'text'} value={candidate[key]} onChange={e => setField(key, e.target.value)} /></label>)}
            </div>
            <div className="two">
              {fieldLabels.slice(4, 10).map(([key, label]) => <label key={key}>{label}<input type={key === 'years_experience' || key === 'relevant_experience_years' ? 'number' : 'text'} min={key === 'years_experience' || key === 'relevant_experience_years' ? '0' : undefined} step={key === 'years_experience' || key === 'relevant_experience_years' ? '0.1' : undefined} value={candidate[key]} onChange={e => setField(key, e.target.value)} /></label>)}
            </div>
            <div className="two">
              {fieldLabels.slice(10, 16).map(([key, label]) => <label key={key}>{label}<input type={key === 'notice_period_days' ? 'number' : 'text'} min={key === 'notice_period_days' ? '0' : undefined} value={candidate[key]} onChange={e => setField(key, e.target.value)} /></label>)}
            </div>
            <div className="two">
              {fieldLabels.slice(16).map(([key, label]) => <label key={key}>{label}<input type={key === 'current_compensation' || key === 'expected_compensation' ? 'number' : key === 'email' ? 'email' : 'text'} value={candidate[key]} onChange={e => setField(key, e.target.value)} /></label>)}
            </div>
            <label>Certifications<input value={candidate.certifications} onChange={e => setField('certifications', e.target.value)} /></label>
            <label>Education<textarea rows={3} value={candidate.education} onChange={e => setField('education', e.target.value)} /></label>
            <label>Technical responsibilities<textarea rows={5} value={candidate.technical_responsibilities} onChange={e => setField('technical_responsibilities', e.target.value)} /></label>
            <label>Management / leadership responsibilities<textarea rows={4} value={candidate.management_responsibilities} onChange={e => setField('management_responsibilities', e.target.value)} /></label>
            <label>Achievements / awards<textarea rows={4} value={candidate.achievements} onChange={e => setField('achievements', e.target.value)} /></label>
            <label>Projects<textarea rows={4} value={candidate.projects} onChange={e => setField('projects', e.target.value)} /></label>
            <div className="two"><label>Recruiter<input value={candidate.recruiter} onChange={e => setField('recruiter', e.target.value)} /></label><label>Source<input value={candidate.source} onChange={e => setField('source', e.target.value)} /></label></div>
            <label>Recruiter notes<textarea rows={3} value={candidate.recruiter_notes} onChange={e => setField('recruiter_notes', e.target.value)} /></label>
            <button className="adminButton" type="submit" disabled={saving || parsing || !parsed}>{saving ? 'Saving…' : 'Save candidate + resume'}</button>
          </form>
        </section>
      )}

      <div className="adminGrid" style={{ marginBottom: 35 }}>
        <section className="adminForm">
          <h2>Exact requirement search</h2>
          <form onSubmit={findMatches}>
            <label>Requirement<textarea rows={3} value={requirement} onChange={e => setRequirement(e.target.value)} placeholder="Need 5 Senior Data Engineers in Hyderabad…" /></label>
            <div className="two"><label>Location<input value={location} onChange={e => setLocation(e.target.value)} /></label><label>Minimum experience<input type="number" min="0" value={experienceMin} onChange={e => setExperienceMin(e.target.value)} /></label></div>
            <div className="two"><label>All required skills<input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, SQL, Spark" /></label><label>Maximum notice days<input type="number" min="0" value={noticeDays} onChange={e => setNoticeDays(e.target.value)} /></label></div>
            <button className="adminButton" type="submit" disabled={busy}>{busy ? 'Searching…' : 'Search exact matches →'}</button>
          </form>
        </section>
        <section className="adminList">
          <h2>Talent Database</h2>
          <form onSubmit={searchCandidates}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone, skill, company, location…" /><button className="adminButton" type="submit" style={{ marginTop: 12 }} disabled={busy}>{busy ? 'Searching…' : 'Search database →'}</button></form>
          <p style={{ color: '#667085', fontSize: 12 }}>{candidates.length} active profile{candidates.length === 1 ? '' : 's'} loaded.</p>
        </section>
      </div>

      <h2>{matches.length ? 'Exact matches' : 'Talent profiles'}</h2>
      {list.length === 0 ? <p>No profiles found in the current Talent Database.</p> : <div className="dashboardList">{list.map(item => {
        const p = item.profile || {}; const t = item.talent || {}
        return <article key={item.candidate_id} className="applicationRow">
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start' }}>
              <div><span className="status">{p.candidate_status || 'active'}</span><h3>{p.full_name || 'Unnamed candidate'}</h3><p>{p.current_role || t.current_role || 'Role not provided'} · {p.current_company || 'Company not provided'}</p></div>
              <button type="button" className="adminButton" disabled={deletingId === item.candidate_id} onClick={() => deleteCandidate(item)}>{deletingId === item.candidate_id ? 'Deleting…' : 'Delete permanently'}</button>
            </div>
            <p><strong>Location:</strong> {[p.city, p.state, p.country].filter(Boolean).join(', ') || p.location || 'Not provided'} · <strong>Total experience:</strong> {p.experience_years ?? 'Not provided'} years · <strong>Relevant:</strong> {p.relevant_experience_years ?? t.relevant_experience_years ?? 'Not provided'} years · <strong>Notice:</strong> {p.notice_period_days ?? 'Not provided'} days</p>
            <p><strong>Skills:</strong> {[t.primary_skill, ...(t.secondary_skills || [])].filter(Boolean).join(', ') || 'Not provided'}</p>
            {p.email && <p>{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>}
            {p.resume_url && <a href={`/api/resumes?path=${encodeURIComponent(p.resume_url)}`} target="_blank" rel="noreferrer">Open resume ↗</a>}
          </div>
        </article>
      })}</div>}
    </section>
  )
}
