import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { supabase, role } = await getAuthContext()
  if (role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'employer').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employers: data || [] })
}

export async function PATCH(request: NextRequest) {
  const { supabase, role } = await getAuthContext()
  if (role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  const input = await request.json()
  const id = String(input.id || '').trim()
  const status = String(input.employer_status || '')
  if (!id || !['pending','approved','rejected'].includes(status)) return NextResponse.json({ error: 'Valid employer id and status are required' }, { status: 400 })
  const { data, error } = await supabase.from('profiles').update({ employer_status: status, role: 'employer' }).eq('id', id).eq('role', 'employer').select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employer: data })
}
