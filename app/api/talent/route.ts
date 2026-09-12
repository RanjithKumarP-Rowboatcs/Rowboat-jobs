import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

function staffOnly(role: string | null) {
  return role === 'admin'
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function candidateScore(candidate: any, requirement: { text?: string; location?: string; skills?: string[]; experienceMin?: number; noticeDays?: number }) {
  const haystack = [
    candidate.profile?.full_name,
    candidate.profile?.headline,
    candidate.profile?.location,
    candidate.profile?.current_company,
    candidate.talent?.technology,
    candidate.talent?.primary_skill,
    ...(candidate.talent?.secondary_skills || []),
    ...(candidate.talent?.certifications || []),
    ...(candidate.talent?.projects || []),
    candidate.talent?.industry,
  ].filter(Boolean).join(' ').toLowerCase()

  const requestedSkills = (requirement.skills || []).map(s => s.toLowerCase()).filter(Boolean)
  const matchedSkills = requestedSkills.filter(s => haystack.includes(s))
  let score = 45
  if (requestedSkills.length) score += Math.min(30, (matchedSkills.length / requestedSkills.length) * 30)

  const location = asText(candidate.profile?.location).toLowerCase()
  const wantedLocation = asText(requirement.location).toLowerCase()
  if (wantedLocation && location.includes(wantedLocation)) score += 15

  const experience = Number(candidate.profile?.experience_years || 0)
  if (requirement.experienceMin && experience >= requirement.experienceMin) score += 7

  const notice = Number(candidate.profile?.notice_period_days)
  if (requirement.noticeDays != null && Number.isFinite(notice) && notice <= requirement.noticeDays) score += 3

  return Math.max(0, Math.min(99, Math.round(score)))
}

export async function GET(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })

  const search = request.nextUrl.searchParams.get('search')?.trim().toLowerCase() || ''
  const { data: talent, error } = await supabase
    .from('talent_profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (talent || []).map((row: any) => row.candidate_id)
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from('profiles').select('id,full_name,email,phone,headline,location,current_company,experience_years,notice_period_days,available_from,immediate_joiner,current_ctc,expected_ctc,resume_url').in('id', ids)
    : { data: [], error: null }
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  let candidates = (talent || []).map((t: any) => ({ talent: t, profile: profileMap.get(t.candidate_id) || null }))
  if (search) {
    candidates = candidates.filter((c: any) => JSON.stringify(c).toLowerCase().includes(search))
  }
  return NextResponse.json({ candidates, total: candidates.length })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })
  const body = await request.json()
  const candidateId = asText(body.candidate_id)
  if (!candidateId) return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 })
  const allowed = ['technology','primary_skill','secondary_skills','industry','previous_companies','employment_type','work_authorization','certifications','projects','availability','recruiter','candidate_status','source','last_contacted_at','ai_generated_skill_profile','recruiter_notes']
  const payload: Record<string, any> = {}
  for (const key of allowed) if (body[key] !== undefined) payload[key] = body[key]
  const { data, error } = await supabase.from('talent_profiles').upsert({ candidate_id: candidateId, ...payload }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ talent: data })
}

export async function POST(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })
  const body = await request.json()
  const requirement = {
    text: asText(body.text),
    location: asText(body.location),
    skills: Array.isArray(body.skills) ? body.skills.map(asText).filter(Boolean) : asText(body.skills).split(',').map(s => s.trim()).filter(Boolean),
    experienceMin: Number(body.experienceMin || 0),
    noticeDays: body.noticeDays === undefined || body.noticeDays === '' ? undefined : Number(body.noticeDays),
  }

  const { data: talent, error } = await supabase.from('talent_profiles').select('*').limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (talent || []).map((row: any) => row.candidate_id)
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from('profiles').select('id,full_name,email,phone,headline,location,current_company,experience_years,notice_period_days,available_from,immediate_joiner,current_ctc,expected_ctc,resume_url').in('id', ids)
    : { data: [], error: null }
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const matches = (talent || []).map((t: any) => {
    const profile = profileMap.get(t.candidate_id) || null
    return { candidate_id: t.candidate_id, talent: t, profile, score: candidateScore({ talent: t, profile }, requirement) }
  }).sort((a: any, b: any) => b.score - a.score).slice(0, 25)

  return NextResponse.json({ matches, requirement })
}
