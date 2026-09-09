import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  return NextResponse.json({ user: { id: user.id, email: user.email }, role, profile })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (role === 'admin') return NextResponse.json({ error: 'Admin profile is managed separately.' }, { status: 403 })

  const input = await request.json()
  const requestedEmail = String(input.email || '').trim().toLowerCase()
  if (requestedEmail && requestedEmail !== String(user.email || '').toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email: requestedEmail })
    if (emailError) return NextResponse.json({ error: emailError.message }, { status: 400 })
  }
  const patch = {
    full_name: String(input.full_name || '').trim() || null,
    phone: String(input.phone || '').trim() || null,
    resume_url: String(input.resume_url || '').trim() || null,
    linkedin_url: String(input.linkedin_url || '').trim() || null,
    company_name: String(input.company_name || '').trim() || null,
    company_website: String(input.company_website || '').trim() || null,
  }

  const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
