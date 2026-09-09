'use client'

import { FormEvent, useEffect, useState } from 'react'
import RowboatLogo from '../../../components/RowboatLogo'
import { createClient } from '../../lib/supabase/browser'

type Role = 'candidate' | 'employer'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<Role>('candidate')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) routeUser(data.user)
    })
  }, [])

  async function routeUser(user: any) {
    if (user.app_metadata?.role === 'admin') {
      location.href = '/admin'
      return
    }

    const response = await fetch('/api/profile', { cache: 'no-store' })
    const body = await response.json()

    if (body.role === 'employer') location.href = '/employer'
    else location.href = '/candidate'
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('Please enter your full name.')
        if (role === 'employer' && !companyName.trim()) {
          throw new Error('Please enter your company name.')
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              requested_role: role,
              full_name: fullName.trim(),
              company_name: companyName.trim(),
            },
          },
        })

        if (signUpError) throw signUpError

        if (data.session) {
          if (role === 'employer') {
            await fetch('/api/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                full_name: fullName,
                company_name: companyName,
              }),
            })
          }

          location.href = role === 'employer' ? '/employer' : '/candidate'
        } else {
          setMessage(
            role === 'employer'
              ? 'Account created. Check your email to confirm the account. Your employer access will still need Rowboat admin approval before you can post jobs.'
              : 'Account created. Check your email to confirm the account, then sign in to use your candidate dashboard.'
          )
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          })

        if (signInError) throw signInError

        await routeUser(data.user)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete the request.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="portalShell">
      <div className="portalCard">
        <a href="/">
          <img
            className="portalLogo"
            src="/rowboat-logo.svg"
            alt="ROWBOAT CONSULTING SERVICES"
          />
        </a>

        <div className="eyebrow">ROWBOAT PORTAL</div>

        <h1>
          {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
        </h1>

        <p className="portalLead">
          One login for candidates and employers. The administrator area
          remains protected separately.
        </p>

        <div className="portalSwitch">
          <button
            className={mode === 'signin' ? 'active' : ''}
            type="button"
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>

          <button
            className={mode === 'signup' ? 'active' : ''}
            type="button"
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <div className="roleSwitch">
          <button
            className={role === 'candidate' ? 'active' : ''}
            type="button"
            onClick={() => setRole('candidate')}
          >
            I’m looking for opportunities
          </button>

          <button
            className={role === 'employer' ? 'active' : ''}
            type="button"
            onClick={() => setRole('employer')}
          >
            I’m hiring
          </button>
        </div>

        <form className="portalForm" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Full name
              <input
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </label>
          )}

          {mode === 'signup' && role === 'employer' && (
            <label>
              Company name
              <input
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Your company"
                autoComplete="organization"
              />
            </label>
          )}

          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
            />
          </label>

          {error && <div className="portalMessage error">{error}</div>}
          {message && <div className="portalMessage">{message}</div>}

          <button className="portalButton" disabled={busy}>
            {busy
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign in →'
                : 'Create account →'}
          </button>
        </form>

        {mode === 'signin' && (
          <a className="backLink" href="/admin/login">
            Administrator sign in
          </a>
        )}

        <a className="backLink" href="/">
          ← Back to website
        </a>
      </div>
    </main>
  )
}
