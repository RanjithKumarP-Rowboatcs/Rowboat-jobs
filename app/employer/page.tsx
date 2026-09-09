'use client'

import { FormEvent, useEffect, useState } from 'react'
import RowboatLogo from '../../../components/RowboatLogo'
import { createClient } from '../../lib/supabase/browser'

const emptyJob={title:'',company:'',module:'SAP',industry:'Information Technology',location:'India',experience:'',type:'Full-time',openings:1,salary:'',description:'',requirements:'',responsibilities:'',skills:'',apply_email:'',reference_code:'',status:'draft'}

export default function EmployerPage(){
  const [profile,setProfile]=useState<any>(null),[email,setEmail]=useState(''),[jobs,setJobs]=useState<any[]>([]),[applications,setApplications]=useState<any[]>([])
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[job,setJob]=useState<any>(emptyJob),[busy,setBusy]=useState(false)

  useEffect(()=>{load()},[])
  async function load(){
    setLoading(true);setError('')
    try{
      const supabase=createClient();const {data}=await supabase.auth.getUser()
      if(!data.user){location.href='/login';return}
      setEmail(data.user.email||'')
      const p=await fetch('/api/profile',{cache:'no-store'});const pb=await p.json()
      if(!p.ok)throw new Error(pb.error||'Unable to load profile.')
      if(pb.role!=='employer'){location.href=pb.role==='candidate'?'/candidate':'/admin';return}
      setProfile(pb.profile||{})
      const [jr,ar]=await Promise.all([fetch('/api/jobs?mine=1',{cache:'no-store'}),fetch('/api/applications?mine=1',{cache:'no-store'})])
      const jb=await jr.json(),ab=await ar.json()
      if(jr.ok)setJobs(jb.jobs||[])
      if(ar.ok)setApplications(ab.applications||[])
    }catch(e){setError(e instanceof Error?e.message:'Unable to load employer dashboard.')}
    finally{setLoading(false)}
  }
  async function saveJob(e:FormEvent){
    e.preventDefault();setBusy(true);setError('');setMessage('')
    try{
      const payload={...job,company:job.company||profile?.company_name||'',apply_email:job.apply_email||email,skills:String(job.skills||'').split(',').map((s:string)=>s.trim()).filter(Boolean),openings:Number(job.openings)||1}
      const r=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const b=await r.json();if(!r.ok)throw new Error(b.error||'Unable to submit job')
      setMessage('Job submitted. It is now pending Rowboat admin approval.');setJob(emptyJob);await load()
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit job.')}finally{setBusy(false)}
  }
  async function signOut(){const supabase=createClient();await supabase.auth.signOut();location.href='/login'}
  const approved=profile?.employer_status==='approved'
  return <main className="portalShell"><header className="portalHeader"><a href="/"><RowboatLogo /></a><div><a className="portalHeaderLink" href="/opportunities">View opportunities</a><button type="button" onClick={signOut}>Sign out</button></div></header><div className="dashboardWrap"><section className="dashboardHero"><div><div className="eyebrow">EMPLOYER PORTAL</div><h1>Build your team.</h1><p>Manage your company recruitment activity from one secure workspace.</p></div></section>{loading?<div className="portalPanel">Loading…</div>:<>{error&&<div className="portalMessage error" style={{marginBottom:24}}>{error}</div>}<div className="portalGrid"><section className="portalPanel"><div className="panelHeading"><h2>Company profile</h2><span className="portalBadge pending">{approved?'Approved':'Pending review'}</span></div><div className="portalForm"><label>Company<input value={profile?.company_name||''} readOnly/></label><label>Contact name<input value={profile?.full_name||''} readOnly/></label><label>Email<input value={email} readOnly/></label></div></section><section className="portalPanel"><h2>{approved?'Submit a job':'Approval required'}</h2>{approved?<form className="portalForm" onSubmit={saveJob}><label>Job title<input required value={job.title} onChange={e=>setJob({...job,title:e.target.value})}/></label><label>SAP module / category<input value={job.module} onChange={e=>setJob({...job,module:e.target.value})}/></label><label>Industry<input value={job.industry} onChange={e=>setJob({...job,industry:e.target.value})}/></label><label>Location<input value={job.location} onChange={e=>setJob({...job,location:e.target.value})}/></label><label>Experience<input value={job.experience} onChange={e=>setJob({...job,experience:e.target.value})} placeholder="5+ years"/></label><label>Type<select value={job.type} onChange={e=>setJob({...job,type:e.target.value})}><option>Full-time</option><option>Contract</option><option>Part-time</option><option>Remote</option></select></label><label>Openings<input type="number" min="1" value={job.openings} onChange={e=>setJob({...job,openings:e.target.value})}/></label><label>Salary / CTC<input value={job.salary} onChange={e=>setJob({...job,salary:e.target.value})}/></label><label>Skills<input value={job.skills} onChange={e=>setJob({...job,skills:e.target.value})} placeholder="SAP, S/4HANA, BTP"/></label><label>Description<textarea rows={4} value={job.description} onChange={e=>setJob({...job,description:e.target.value})}/></label><label>Requirements<textarea rows={5} value={job.requirements} onChange={e=>setJob({...job,requirements:e.target.value})}/></label><label>Responsibilities<textarea rows={5} value={job.responsibilities} onChange={e=>setJob({...job,responsibilities:e.target.value})}/></label><button className="portalButton" disabled={busy}>{busy?'Submitting…':'Submit job for approval →'}</button></form>:<div className="portalNotice"><strong>Your employer account needs Rowboat approval.</strong><span>An administrator must approve your company before you can submit jobs. You can return here after approval.</span></div>}{message&&<div className="portalMessage">{message}</div>}</section></div><section className="portalPanel" style={{marginTop:24}}><h2>Your jobs</h2>{jobs.length===0?<p>No jobs submitted yet.</p>:jobs.map(j=><article className="applicationRow" key={j.id}><div><span className="status">{j.approval_status||'approved'}</span><h3>{j.title}</h3><p>{j.module||j.industry||'Opportunity'} · {j.location||'India'} · {j.openings||1} opening(s)</p></div></article>)}</section><section className="portalPanel" style={{marginTop:24}}><h2>Applications to your jobs</h2>{applications.length===0?<p>No applications yet.</p>:applications.map(a=><article className="applicationRow" key={a.id}><div><span className={`status ${a.status}`}>{a.status}</span><h3>{a.full_name}</h3><p>{a.jobs?.title||'Opportunity'} · {a.email}</p>{a.resume_url&&<a href={a.resume_url.startsWith('storage:')?`/api/resumes?path=${encodeURIComponent(a.resume_url)}`:a.resume_url} target="_blank" rel="noreferrer">Open resume ↗</a>}</div></article>)}</section></>}</div></main>
}
