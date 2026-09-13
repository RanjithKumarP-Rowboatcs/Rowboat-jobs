import { NextResponse } from 'next/server'
import { getAuthContext } from '../../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function staffOnly(role: string | null) {
  return role === 'admin' || role === 'super_admin' || role === 'recruiter'
}
function text(v: unknown) { return typeof v === 'string' ? v.trim() : '' }
function norm(v: unknown) { return text(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }
function aliases(v: string) {
  const x = norm(v)
  const map: Record<string, string[]> = {
    bangalore: ['bangalore', 'bengaluru'], bengaluru: ['bangalore', 'bengaluru'],
    gurgaon: ['gurgaon', 'gurugram'], gurugram: ['gurgaon', 'gurugram'],
    noida: ['noida', 'delhi ncr', 'new delhi'], 'delhi ncr': ['noida', 'delhi ncr', 'new delhi', 'delhi'],
    mumbai: ['mumbai', 'bombay'], hyderabad: ['hyderabad', 'secunderabad'],
    chennai: ['chennai', 'madras'], pune: ['pune'], kolkata: ['kolkata', 'calcutta'], ahmedabad: ['ahmedabad'],
    india: ['india'],
  }
  return map[x] || [x]
}
function includesAny(haystack: string, wanted: string) {
  return aliases(wanted).some(a => haystack.includes(a))
}
function rowText(c: any) {
  return [c.location, c.country, c.state, c.city, c.metro_area, c.technology, c.primary_skill, ...(c.secondary_skills || []), c.industry, c.current_company, c.candidate_current_role, ...(c.previous_companies || []), ...(c.certifications || []), ...(c.projects || []), ...(c.education_text || []), ...(c.technical_responsibilities || []), ...(c.management_responsibilities || []), ...(c.achievements_text || [])].filter(Boolean).join(' ').toLowerCase()
}
function map(c: any) {
  return {
    candidate_id: c.id,
    talent: {
      technology: c.technology, primary_skill: c.primary_skill, secondary_skills: c.secondary_skills || [], industry: c.industry,
      certifications: c.certifications || [], projects: c.projects || [], current_role: c.candidate_current_role || c.current_role,
      relevant_experience_years: c.relevant_experience_years, candidate_status: c.candidate_status, recruiter: c.recruiter,
    },
    profile: {
      id: c.id, full_name: c.full_name, email: c.email, phone: c.phone, location: c.location, country: c.country, state: c.state, city: c.city, metro_area: c.metro_area,
      current_company: c.current_company, experience_years: c.years_experience, relevant_experience_years: c.relevant_experience_years,
      notice_period_days: c.notice_period_days, resume_url: c.resume_storage_path ? `storage:talent-pool/${c.id}/${c.resume_file_name || c.resume_storage_path.split('/').pop() || ''}` : null,
      candidate_status: c.candidate_status,
    },
  }
}

export async function POST(request: Request) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Admin/recruiter access required' }, { status: 403 })

  const body = await request.json()
  const location = text(body?.location)
  const skills = (Array.isArray(body?.skills) ? body.skills : text(body?.skills).split(',')).map(text).filter(Boolean)
  const experienceMin = Number(body?.experienceMin || 0)
  const noticeDays = body?.noticeDays === '' || body?.noticeDays == null ? null : Number(body.noticeDays)
  const limit = Math.min(100, Math.max(1, Number(body?.limit || 50)))
  const query = norm(body?.requirement)

  const { data, error } = await supabase.from('talent_pool_candidates').select('*').order('updated_at', { ascending: false }).limit(1000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const matches = (data || []).filter((c: any) => {
    const haystack = rowText(c)
    if (query) {
      const queryTokens = query.split(/\s+/).filter(token => token.length > 2 && !['need', 'senior', 'engineer', 'engineers', 'developer', 'developers', 'who', 'can', 'join', 'within', 'days'].includes(token))
      if (queryTokens.length && !queryTokens.every((token: string) => haystack.includes(token))) return false
    }
    if (location && !includesAny(haystack, location)) return false
    if (experienceMin > 0 && Number(c.years_experience || 0) < experienceMin) return false
    if (noticeDays != null && Number.isFinite(noticeDays) && (c.notice_period_days == null || Number(c.notice_period_days) > noticeDays)) return false
    if (skills.length && !skills.every((skill: string) => haystack.includes(norm(skill)))) return false
    return true
  }).slice(0, limit).map(map)

  return NextResponse.json({ matches, exact: true, filters: { location, skills, experienceMin, noticeDays }, message: matches.length ? undefined : 'No candidates matched every supplied requirement.' })
}
