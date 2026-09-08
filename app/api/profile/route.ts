import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getContext()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in required' },
      { status: 401 }
    )
  }

  const role =
    user.app_metadata?.role === 'admin'
      ? 'admin'
      : user.user_metadata?.requested_role === 'employer'
        ? 'employer'
        : 'candidate'

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    profile: profile || null,
    role: profile?.role || role,
    employer_status: profile?.employer_status || 'not_requested',
  })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getContext()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in required' },
      { status: 401 }
    )
  }

  const body = await request.json()

  const updates: Record<string, unknown> = {}

  if (body.full_name !== undefined) {
    updates.full_name = String(body.full_name || '').trim() || null
  }

  if (body.company_name !== undefined) {
    updates.company_name =
      String(body.company_name || '').trim() || null
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ...updates,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ profile: data })
}
