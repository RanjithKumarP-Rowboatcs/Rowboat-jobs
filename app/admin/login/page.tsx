'use client'
import { FormEvent, useState } from 'react'
import { createClient } from '../../../lib/supabase/browser'

export default function AdminLogin(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)

  async function submit(e:FormEvent){
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const supabase=createClient()
      const {error}=await supabase.auth.signInWithPassword({email,password})
      if(error) setError(error.message)
      else location.href='/admin'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initialize admin sign-in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="adminShell"><div className="loginCard"><img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES"/><div className="eyebrow">ROWBOAT ADMIN</div><h1>Sign in</h1><p>Use the Supabase Auth account created for your Rowboat administrator.</p><form className="adminForm" onSubmit={submit}><label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<div className="adminMessage">{error}</div>}<button className="adminButton" disabled={busy}>{busy?'Signing in…':'Sign in →'}</button></form><a className="backLink" href="/">← Back to website</a></div></main>
}
