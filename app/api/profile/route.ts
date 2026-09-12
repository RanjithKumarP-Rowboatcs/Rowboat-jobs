import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

async function refreshTalentEmbedding(supabase: any, candidateId: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!token || !url) return
    await fetch(`${url}/functions/v1/talent-embed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: candidateId }),
    })
  } catch {
    // Embedding refresh is best-effort; profile saves must still succeed.
  }
}

export async function GET() {
  const { supabase, user, role, profile } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const { data: talent } = role === 'candidate'
    ? await supabase.from('talent_profiles').select('technology,primary_skill,secondary_skills,industry,previous_companies,employment_type,work_authorization,certifications,projects,availability').eq('candidate_id', user.id).maybeSingle()
    : { data: null }
  return NextResponse.json({ user: { id: user.id, email: user.email }, role, profile, talent })
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

  const patch: Record<string, any> = {}
  const textProfileFields = ['full_name','phone','resume_url','linkedin_url','company_name','company_website','location']
  for (const key of textProfileFields) {
    if (Object.prototype.hasOwnProperty.call(input, key)) patch[key] = String(input[key] || '').trim() || null
  }
  if (Object.prototype.hasOwnProperty.call(input, 'experience_years')) patch.experience_years = input.experience_years === '' || input.experience_years == null ? null : Number(input.experience_years)
  if (Object.prototype.hasOwnProperty.call(input, 'notice_period_days')) patch.notice_period_days = input.notice_period_days === '' || input.notice_period_days == null ? null : Number(input.notice_period_days)

  const { data, error } = Object.keys(patch).length
    ? await supabase.from('profiles').update(patch).eq('id', user.id).select('*').single()
    : await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let talent = null
  if (role === 'candidate') {
    const talentPatch: Record<string, any> = {}
    const arrayFields = ['secondary_skills','previous_companies','certifications','projects']
    const textTalentFields = ['technology','primary_skill','industry','employment_type','work_authorization','availability']
    for (const key of textTalentFields) {
      if (Object.prototype.hasOwnProperty.call(input, key)) talentPatch[key] = String(input[key] || '').trim() || null
    }
    for (const key of arrayFields) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        talentPatch[key] = Array.isArray(input[key]) ? input[key].map((v: any) => String(v).trim()).filter(Boolean) : String(input[key] || '').split(',').map(v => v.trim()).filter(Boolean)
      }
    }
    const { data: existingTalent } = await supabase.from('talent_profiles').select('*').eq('candidate_id', user.id).maybeSingle()
    const mergedTalent = { ...(existingTalent || {}), candidate_id: user.id, ...talentPatch }
    const { data: talentData, error: talentError } = await supabase.from('talent_profiles').upsert(mergedTalent).select('technology,primary_skill,secondary_skills,industry,previous_companies,employment_type,work_authorization,certifications,projects,availability').single()
    if (talentError) return NextResponse.json({ error: talentError.message }, { status: 500 })
    talent = talentData
    await refreshTalentEmbedding(supabase, user.id)
  }
  return NextResponse.json({ profile: data, talent })
}
