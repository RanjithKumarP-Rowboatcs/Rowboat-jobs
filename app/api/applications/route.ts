import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isApprovedEmployer } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthContext()
  const body = await request.json()
  const full_name = String(body.full_name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const job_id = String(body.job_id || '').trim()
  if (!full_name || !email || !job_id) return NextResponse.json({ error: 'Name, email and job are required.' }, { status: 400 })

  const { data: job } = await supabase.from('jobs').select('id,title,status,approval_status').eq('id', job_id).eq('status', 'open').eq('approval_status', 'approved').maybeSingle()
  if (!job) return NextResponse.json({ error: 'This opportunity is no longer open.' }, { status: 404 })

  const { error } = await supabase.from('rowboat_applications').insert({
    job_id, candidate_id: user?.id || null, full_name, email,
    phone: String(body.phone || '').trim() || null,
    resume_url: String(body.resume_url || '').trim() || null,
    linkedin_url: String(body.linkedin_url || '').trim() || null,
    cover_letter: String(body.cover_letter || '').trim() || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Application submitted successfully.' })
}

export async function GET(request: NextRequest) {
  const mine = request.nextUrl.searchParams.get('mine') === '1'
  const { supabase, user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  if (role === 'admin' && !mine) {
    const { data, error } = await supabase.from('rowboat_applications').select('*, jobs(title,company,reference_code,created_by)').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ applications: data || [] })
  }
  if (mine && role === 'candidate') {
    const { data, error } = await supabase.from('rowboat_applications').select('*, jobs(title,company,reference_code,status)').eq('candidate_id', user.id).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ applications: data || [] })
  }
  if (mine && role === 'employer' && isApprovedEmployer(role, profile)) {
    const { data, error } = await supabase.from('rowboat_applications').select('*, jobs!inner(title,company,reference_code,created_by)').eq('jobs.created_by', user.id).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ applications: data || [] })
  }
  return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
}
