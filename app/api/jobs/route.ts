import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isApprovedEmployer } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

const PUBLIC_INDUSTRIES = ['Information Technology', 'Manufacturing']

function cleanJob(input: Record<string, unknown>) {
  return {
    title: String(input.title || '').trim(),
    company: String(input.company || '').trim() || null,
    module: String(input.module || '').trim() || null,
    industry: String(input.industry || '').trim() || null,
    location: String(input.location || '').trim() || null,
    experience: String(input.experience || '').trim() || null,
    type: String(input.type || '').trim() || 'Full-time',
    openings: Math.max(1, Number(input.openings || 1)),
    salary: String(input.salary || '').trim() || null,
    description: String(input.description || '').trim() || null,
    requirements: String(input.requirements || '').trim() || null,
    responsibilities: String(input.responsibilities || '').trim() || null,
    skills: Array.isArray(input.skills) ? input.skills.map(String).map(s => s.trim()).filter(Boolean) : [],
    apply_email: String(input.apply_email || '').trim() || null,
    reference_code: String(input.reference_code || '').trim() || null,
    status: ['draft', 'open', 'closed'].includes(String(input.status)) ? String(input.status) : 'draft',
  }
}

export async function GET(request: NextRequest) {
  const mine = request.nextUrl.searchParams.get('mine') === '1'
  const admin = request.nextUrl.searchParams.get('admin') === '1'
  const { supabase, user, role } = await getAuthContext()

  if ((admin || mine) && !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (admin && role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  if (mine && role !== 'employer') return NextResponse.json({ error: 'Employer access required' }, { status: 403 })

  let query = supabase.from('jobs').select('*').order('created_at', { ascending: false })
  if (admin) {
    // Admin sees everything, including pending employer submissions.
  } else if (mine) {
    query = query.eq('created_by', user!.id)
  } else {
    query = query.eq('status', 'open').eq('approval_status', 'approved').in('industry', PUBLIC_INDUSTRIES)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ jobs: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  const { supabase, user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (role !== 'admin' && !isApprovedEmployer(role, profile)) {
    return NextResponse.json({ error: role === 'employer' ? 'Employer account is awaiting admin approval' : 'Employer or admin access required' }, { status: 403 })
  }

  const input = await request.json()
  const job = cleanJob(input)
  if (!job.title) return NextResponse.json({ error: 'Job title is required' }, { status: 400 })

  const employer = role === 'employer'
  const record = {
    ...job,
    created_by: user.id,
    approval_status: employer ? 'pending' : 'approved',
    status: employer ? 'draft' : job.status,
    published_at: role === 'admin' && job.status === 'open' ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase.from('jobs').insert(record).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}
