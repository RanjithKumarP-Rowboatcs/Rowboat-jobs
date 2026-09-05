import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()
  const full_name = String(body.full_name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const job_id = String(body.job_id || '').trim()

  if (!full_name || !email || !job_id) {
    return NextResponse.json({ error: 'Name, email and job are required.' }, { status: 400 })
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id,title,status')
    .eq('id', job_id)
    .eq('status', 'open')
    .maybeSingle()

  if (!job) {
    return NextResponse.json({ error: 'This opportunity is no longer open.' }, { status: 404 })
  }

  const { error } = await supabase.from('rowboat_applications').insert({
    job_id,
    full_name,
    email,
    phone: String(body.phone || '').trim() || null,
    resume_url: String(body.resume_url || '').trim() || null,
    linkedin_url: String(body.linkedin_url || '').trim() || null,
    cover_letter: String(body.cover_letter || '').trim() || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Application submitted successfully.' })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { data, error } = await supabase
    .from('rowboat_applications')
    .select('*, jobs(title,company,reference_code)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data || [] })
}
