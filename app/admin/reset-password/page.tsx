'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/browser'

const SITE_URL = 'https://www.rowboatconsultingservices.com'

export default function ResetPassword(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [recovery,setRecovery]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)

  useEffect(()=>{
    const supabase=createClient()
    const hash=window.location.hash
    if(hash.includes('access_token=')) setRecovery(true)

    const { data } = supabase.auth.onAuthStateChange((event)=>{
      if(event==='PASSWORD_RECOVERY') setRecovery(true)
    })
    return ()=>data.subscription.unsubscribe()
  },[])

  async function requestReset(e:FormEvent){
    e.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try{
      const supabase=createClient()
      const {error}=await supabase.auth.resetPasswordForEmail(email,{
        redirectTo:`${SITE_URL}/admin/reset-password`,
      })
      if(error) setError(error.message)
      else setMessage('If that account exists, a password-reset email has been sent. Open the newest email and follow the link.')
    }catch(err){
      setError(err instanceof Error ? err.message : 'Unable to start password recovery.')
    }finally{setBusy(false)}
  }

  async function updatePassword(e:FormEvent){
    e.preventDefault()
    setError(''); setMessage('')
    if(password.length<8){setError('Password must be at least 8 characters.');return}
    if(password!==confirm){setError('Passwords do not match.');return}
    setBusy(true)
    try{
      const supabase=createClient()
      const {error}=await supabase.auth.updateUser({password})
      if(error) setError(error.message)
      else {
        setMessage('Password updated successfully. Redirecting to admin sign in…')
        setTimeout(()=>{location.href='/admin/login'},900)
      }
    }catch(err){
      setError(err instanceof Error ? err.message : 'Unable to update the password.')
    }finally{setBusy(false)}
  }

  return <main className="adminShell"><div className="loginCard"><img src="/rowboat-logo.svg" alt="ROWBOAT CONSULTING SERVICES"/><div className="eyebrow">ROWBOAT ADMIN</div><h1>{recovery?'Set password':'Reset password'}</h1><p>{recovery?'Choose a new password for the Rowboat administrator account.':'Enter the Rowboat administrator email and we will send a secure password-reset link.'}</p>{recovery?<form className="adminForm" onSubmit={updatePassword}><label>New password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm password<input required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>{error&&<div className="adminMessage">{error}</div>}{message&&<div className="adminMessage">{message}</div>}<button className="adminButton" disabled={busy}>{busy?'Updating…':'Set new password →'}</button></form>:<form className="adminForm" onSubmit={requestReset}><label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ranjith@rowboatcs.com"/></label>{error&&<div className="adminMessage">{error}</div>}{message&&<div className="adminMessage">{message}</div>}<button className="adminButton" disabled={busy}>{busy?'Sending…':'Send reset link →'}</button></form>}<a className="backLink" href="/admin/login">← Back to sign in</a></div></main>
}
