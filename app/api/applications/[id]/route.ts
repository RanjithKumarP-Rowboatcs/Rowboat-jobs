import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, isApprovedEmployer } from '../../../../lib/supabase/authorization'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { supabase, user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const { id } = await context.params
  const { status } = await request.json()
  if (!['new', 'reviewing', 'shortlisted', 'rejected', 'hired'].includes(status)) return NextResponse.json({ error: 'Invalid application status' }, { status: 400 })

  if (role === 'admin') {
    const { data, error } = await supabase.from('rowboat_applications').update({ status }).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ application: data })
  }

  if (role === 'employer' && isApprovedEmployer(role, profile)) {
    const { data, error } = await supabase.from('rowboat_applications')
      .update({ status }).eq('id', id)
      .select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ application: data })
  }

  return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
}
