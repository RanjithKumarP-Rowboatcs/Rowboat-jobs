'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'

interface Job {
  id: string
  title: string
  company?: string
  module?: string
  industry?: string
  location?: string
  experience?: string
  type?: string
  openings?: number
  salary?: string
  description?: string
  requirements?: string
  responsibilities?: string
  skills?: string[]
  apply_email?: string
  reference_code?: string
  status: 'open' | 'closed' | 'draft'
}

export default function OpportunitiesPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [query, setQuery] = useState('')
  const [module, setModule] = useState('All modules')
  const [selected, setSelected] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/jobs').then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.error || 'Unable to load opportunities'); setJobs(body.jobs || []) }).catch(e => setError(e.message)).finally(() => setLoading(false)) }, [])
  const modules = useMemo(() => ['All modules', ...Array.from(new Set(jobs.map(j => j.module).filter(Boolean) as string[])).sort()], [jobs])
  const visibleJobs = useMemo(() => jobs.filter(job => { const haystack = [job.title, job.company, job.module, job.industry, job.location, job.experience, job.type, job.description, job.requirements, ...(job.skills || [])].filter(Boolean).join(' ').toLowerCase(); return (!query || haystack.includes(query.toLowerCase())) && (module === 'All modules' || job.module === module) }), [jobs, query, module])
  return <main className="opportunitiesPage"><header className="opportunitiesHeader"><a href="/" className="opportunitiesBrand"><img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES" /></a><a href="/admin" className="backLink">Admin</a></header><section className="opportunitiesHero"><div className="eyebrow">EXPLORE OPPORTUNITIES</div><h1>Find an opportunity that fits you.</h1><p>Search verified requirements by role, SAP module, skill, company or location. Open positions can be updated by the Rowboat team without changing the website code.</p></section><section className="opportunitiesContent"><div className="opportunityTools"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, skill, company or location" aria-label="Search opportunities" /><select value={module} onChange={e => setModule(e.target.value)} aria-label="Filter opportunities">{modules.map(item => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => { setQuery(''); setModule('All modules') }}>Clear</button></div>{loading ? <div className="noJobs"><h2>Loading opportunities…</h2></div> : error ? <div className="noJobs"><h2>Unable to load opportunities.</h2><p>{error}</p></div> : visibleJobs.length > 0 ? <div className="opportunityList">{visibleJobs.map(job => <article className="opportunityCard" key={job.id}><div className="opportunityTop"><span className="opportunityTag">{job.module || job.industry || 'Opportunity'}</span><span>{job.location || 'India'}</span></div><h2>{job.title}</h2>{job.company && <div className="companyName">{job.company}</div>}<div className="opportunityMeta"><span>{job.experience || 'Experience as specified'}</span><span>{job.type || 'Full-time'}</span>{job.openings ? <span>{job.openings} opening{job.openings === 1 ? '' : 's'}</span> : null}</div>{job.description && <p>{job.description}</p>}{job.skills?.length ? <div className="skills">{job.skills.map(skill => <span key={skill}>{skill}</span>)}</div> : null}<button className="applyButton" type="button" onClick={() => setSelected(job)}>View requirement & Apply →</button></article>)}</div> : <div className="noJobs"><div className="noJobsMark">R</div><h2>No current openings published.</h2><p>Verified requirements will appear here as positions become available.</p></div>}</section><footer className="opportunitiesFooter"><img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES" /><div><strong>Rowboat Consulting Services</strong><span>Publish and manage requirements from the admin dashboard.</span></div></footer>{selected && <ApplicationModal job={selected} onClose={() => setSelected(null)} />}</main>
}
function ApplicationModal({ job, onClose }: { job: Job, onClose: () => void }) { const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [form,setForm]=useState({full_name:'',email:'',phone:'',resume_url:'',linkedin_url:'',cover_letter:''}); async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage('');try{const response=await fetch('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,job_id:job.id})});const body=await response.json();if(!response.ok)throw new Error(body.error||'Application failed');setMessage('Application submitted successfully. The Rowboat team can now review it.');setForm({full_name:'',email:'',phone:'',resume_url:'',linkedin_url:'',cover_letter:''})}catch(e){setMessage(e instanceof Error?e.message:'Application failed')}finally{setBusy(false)}}return <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label={`Apply for ${job.title}`}><div className="applicationModal"><button className="modalClose" type="button" onClick={onClose} aria-label="Close">×</button><div className="eyebrow">APPLICATION</div><h2>{job.title}</h2><p className="modalMeta">{job.company || 'Rowboat opportunity'} · {job.location || 'India'} · {job.type || 'Full-time'}</p>{job.description&&<p>{job.description}</p>}{job.requirements&&<div><strong>Requirements</strong><p className="preline">{job.requirements}</p></div>}{job.responsibilities&&<div><strong>Responsibilities</strong><p className="preline">{job.responsibilities}</p></div>}<form onSubmit={submit} className="applicationForm"><input required placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/><input required type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Resume link (Google Drive / OneDrive / URL)" value={form.resume_url} onChange={e=>setForm({...form,resume_url:e.target.value})}/><input placeholder="LinkedIn profile (optional)" value={form.linkedin_url} onChange={e=>setForm({...form,linkedin_url:e.target.value})}/><textarea rows={5} placeholder="Short cover note" value={form.cover_letter} onChange={e=>setForm({...form,cover_letter:e.target.value})}/><button className="applyButton" disabled={busy}>{busy?'Submitting…':'Submit application →'}</button>{message&&<p className="formMessage">{message}</p>}</form></div></div> }
