'use client'

import { useMemo, useState } from 'react'
import data from '../../data/jobs.json'

interface Job {
  id: string
  title: string
  module?: string
  industry?: string
  location?: string
  experience?: string
  type?: string
  openings?: string
  description?: string
  skills?: string[]
  applyEmail?: string
  status?: 'open' | 'closed' | 'draft'
}

const jobs = (data.jobs || []) as Job[]

export default function OpportunitiesPage() {
  const [query, setQuery] = useState('')
  const [module, setModule] = useState('All modules')

  const modules = useMemo(() => ['All modules', ...Array.from(new Set(jobs.map(j => j.module).filter(Boolean) as string[])).sort()], [])
  const visibleJobs = useMemo(() => jobs.filter(job => {
    if (job.status && job.status !== 'open') return false
    const haystack = [job.title, job.module, job.industry, job.location, job.experience, job.type, job.description, ...(job.skills || [])].filter(Boolean).join(' ').toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (module === 'All modules' || job.module === module)
  }), [query, module])

  return <main className="opportunitiesPage">
    <header className="opportunitiesHeader">
      <a href="/" className="opportunitiesBrand"><img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES" /></a>
      <a href="/" className="backLink">← Main website</a>
    </header>

    <section className="opportunitiesHero">
      <div className="eyebrow">ROWBOAT · CAREERS · OPPORTUNITIES</div>
      <h1>Current opportunities.</h1>
      <p>Explore verified requirements shared through Rowboat Consulting Services. New positions can be added by the Rowboat team as they become available.</p>
    </section>

    <section className="opportunitiesContent">
      <div className="opportunityTools">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search role, skill or location" aria-label="Search opportunities" />
        <select value={module} onChange={e => setModule(e.target.value)} aria-label="Filter opportunities">
          {modules.map(item => <option key={item}>{item}</option>)}
        </select>
      </div>

      {visibleJobs.length > 0 ? <div className="opportunityList">{visibleJobs.map(job => {
        const email = job.applyEmail || 'ranjith@rowboatcs.com'
        const subject = `Application enquiry — ${job.title}`
        return <article className="opportunityCard" key={job.id}>
          <div className="opportunityTop"><span className="opportunityTag">{job.module || job.industry || 'Opportunity'}</span><span>{job.location || 'India'}</span></div>
          <h2>{job.title}</h2>
          <div className="opportunityMeta"><span>{job.experience || 'Experience as specified'}</span><span>{job.type || 'Full-time'}</span>{job.openings && <span>{job.openings} openings</span>}</div>
          {job.description && <p>{job.description}</p>}
          {job.skills && job.skills.length > 0 && <div className="skills">{job.skills.map(skill => <span key={skill}>{skill}</span>)}</div>}
          <a className="applyButton" href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>Apply / Enquire →</a>
        </article>
      })}</div> : <div className="noJobs"><div className="noJobsMark">R</div><h2>No current openings published.</h2><p>We will publish verified requirements here as positions become available. If you would like to share your profile or discuss a requirement, contact us directly.</p><a className="applyButton" href="mailto:ranjith@rowboatcs.com?subject=Rowboat%20opportunity%20enquiry">Contact Rowboat →</a></div>}
    </section>

    <footer className="opportunitiesFooter"><img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES" /><div><strong>Need to publish a requirement?</strong><a href="mailto:ranjith@rowboatcs.com?subject=Hiring%20requirement%20for%20Rowboat">Send the requirement to Rowboat →</a></div></footer>
  </main>
}
