import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isApprovedEmployer } from '../../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { supabase, user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const { id } = await context.params
  const input = await request.json()

  if (role !== 'admin' && !isApprovedEmployer(role, profile)) return NextResponse.json({ error: 'Employer approval or admin access required' }, { status: 403 })

  const allowed = ['title','company','module','industry','location','experience','type','openings','salary','description','requirements','responsibilities','skills','apply_email','reference_code','status']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) if (key in input) patch[key] = input[key]
  if ('openings' in patch) patch.openings = Math.max(1, Number(patch.openings || 1))

  if (role === 'admin') {
    if (patch.status === 'open') patch.published_at = new Date().toISOString()
    if (patch.status === 'draft' || patch.status === 'closed') patch.published_at = null
    if ('approval_status' in input) patch.approval_status = ['pending','approved','rejected'].includes(String(input.approval_status)) ? String(input.approval_status) : 'pending'
  } else {
    patch.approval_status = 'pending'
    patch.status = 'draft'
    patch.published_at = null
  }

  let query = supabase.from('jobs').update(patch).eq('id', id)
  if (role === 'employer') query = query.eq('created_by', user.id)
  const { data, error } = await query.select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { supabase, user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (role !== 'admin' && !isApprovedEmployer(role, profile)) return NextResponse.json({ error: 'Employer approval or admin access required' }, { status: 403 })
  const { id } = await context.params
  let query = supabase.from('jobs').delete().eq('id', id)
  if (role === 'employer') query = query.eq('created_by', user.id)
  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
