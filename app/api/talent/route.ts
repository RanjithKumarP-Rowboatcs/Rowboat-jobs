import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAuthContext } from '../../../lib/supabase/authorization'
import { analyzeResume, extractResumeText } from '../../../lib/talent/resume-parser'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function staffOnly(role: string | null) {
  return role === 'admin' || role === 'super_admin' || role === 'recruiter'
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function asArray(value: unknown) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean)
  return asText(value).split(',').map(v => v.trim()).filter(Boolean)
}

function asNumber(value: unknown) {
  if (value === '' || value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function candidateScore(candidate: any, requirement: { text?: string; location?: string; skills?: string[]; experienceMin?: number; noticeDays?: number }) {
  const haystack = [candidate.profile?.full_name, candidate.profile?.headline, candidate.profile?.location, candidate.profile?.current_company, candidate.talent?.technology, candidate.talent?.primary_skill, ...(candidate.talent?.secondary_skills || []), ...(candidate.talent?.certifications || []), ...(candidate.talent?.projects || []), candidate.talent?.industry].filter(Boolean).join(' ').toLowerCase()
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

async function getPoolCandidates(supabase: any) {
  const { data, error } = await supabase.from('talent_pool_candidates').select('*').order('updated_at', { ascending: false }).limit(500)
  if (error) return { candidates: [], error }
  const candidates = (data || []).map((c: any) => ({
    candidate_id: c.id,
    talent: {
      technology: c.technology, primary_skill: c.primary_skill, secondary_skills: c.secondary_skills || [], industry: c.industry,
      previous_companies: c.previous_companies || [], employment_type: c.employment_type, work_authorization: c.work_authorization,
      certifications: c.certifications || [], projects: c.projects || [], availability: c.availability, ai_generated_skill_profile: c.ai_summary,
      candidate_status: c.candidate_status, source: c.source, recruiter: c.recruiter, recruiter_notes: c.recruiter_notes,
    },
    profile: {
      id: c.id, full_name: c.full_name, email: c.email, phone: c.phone, location: c.location, current_company: c.current_company,
      experience_years: c.years_experience, notice_period_days: c.notice_period_days,
      resume_url: c.resume_storage_path ? `storage:${c.resume_storage_path}` : null,
      linkedin_url: c.linkedin_url, current_ctc: c.current_compensation, expected_ctc: c.expected_compensation,
    },
  }))
  return { candidates, error: null }
}

export async function GET(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })

  const search = request.nextUrl.searchParams.get('search')?.trim().toLowerCase() || ''
  const { data: talent, error } = await supabase.from('talent_profiles').select('*').order('updated_at', { ascending: false }).limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (talent || []).map((row: any) => row.candidate_id)
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from('profiles').select('id,full_name,email,phone,headline,location,current_company,experience_years,notice_period_days,available_from,immediate_joiner,current_ctc,expected_ctc,resume_url').in('id', ids)
    : { data: [], error: null }
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  let candidates = (talent || []).map((t: any) => ({ candidate_id: t.candidate_id, talent: t, profile: profileMap.get(t.candidate_id) || null }))
  const pool = await getPoolCandidates(supabase)
  if (pool.error) return NextResponse.json({ error: pool.error.message }, { status: 500 })
  candidates = [...candidates, ...(pool.candidates as CandidateLike[])]
  if (search) candidates = candidates.filter((c: any) => JSON.stringify(c).toLowerCase().includes(search))
  return NextResponse.json({ candidates, total: candidates.length })
}

type CandidateLike = { candidate_id: string; talent: any; profile: any; score?: number }

export async function PUT(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })

  const contentType = request.headers.get('content-type') || ''

  // Preferred flow: upload only a resume. The server extracts the factual fields before saving.
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('resume')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Please select a resume file.' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Resume must be 10 MB or smaller.' }, { status: 400 })

    const allowed = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'])
    const ext = file.name.toLowerCase().split('.').pop() || ''
    const mime = allowed.has(file.type) ? file.type : ext === 'pdf' ? 'application/pdf' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : ext === 'doc' ? 'application/msword' : ''
    if (!mime) return NextResponse.json({ error: 'Unsupported resume format. Please upload PDF, DOCX or DOC.' }, { status: 400 })

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await extractResumeText(buffer, mime)
      if (!text || text.length < 30) return NextResponse.json({ error: 'The resume text could not be read. Please upload a text-based PDF, DOCX or DOC.' }, { status: 400 })
      const parsed = analyzeResume(text)
      if (!parsed.fullName) return NextResponse.json({ error: 'I could not confidently find the candidate name. Please check the resume and enter the name manually.' }, { status: 400 })

      const candidateId = randomUUID()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
      const storagePath = `talent-pool/${candidateId}/${safeName}`
      const upload = await supabase.storage.from('candidate-resumes').upload(storagePath, buffer, { contentType: mime, upsert: false })
      if (upload.error) return NextResponse.json({ error: `Resume storage failed: ${upload.error.message}` }, { status: 500 })

      const candidate = {
        id: candidateId,
        full_name: parsed.fullName,
        email: parsed.email || null,
        phone: parsed.phone || null,
        location: parsed.location || null,
        technology: parsed.technology || null,
        primary_skill: parsed.primarySkill || null,
        secondary_skills: parsed.secondarySkills,
        years_experience: parsed.experienceYears ?? null,
        industry: parsed.industry || null,
        current_company: parsed.currentCompany || null,
        previous_companies: parsed.previousCompanies,
        notice_period_days: parsed.noticePeriodDays ?? null,
        availability: parsed.noticePeriodDays === 0 ? 'Immediate' : parsed.noticePeriodDays != null ? `${parsed.noticePeriodDays} days` : null,
        current_compensation: parsed.currentCompensation ?? null,
        expected_compensation: parsed.expectedCompensation ?? null,
        employment_type: null,
        work_authorization: null,
        certifications: parsed.certifications,
        projects: parsed.projects,
        linkedin_url: parsed.linkedinUrl || null,
        resume_storage_path: storagePath,
        resume_file_name: file.name,
        resume_text: parsed.text,
        ai_summary: parsed.aiSummary,
        ai_extracted_skills: parsed.secondarySkills.length ? [parsed.primarySkill, ...parsed.secondarySkills].filter(Boolean) : parsed.primarySkill ? [parsed.primarySkill] : [],
        ai_certifications: parsed.certifications,
        parsed_data: parsed,
        parse_status: 'completed',
        parse_error: null,
        candidate_status: 'active',
        source: asText(form.get('source')) || 'Resume upload',
        recruiter: asText(form.get('recruiter')) || null,
        recruiter_notes: asText(form.get('recruiter_notes')) || null,
      }

      const { data, error } = await supabase.from('talent_pool_candidates').insert(candidate).select('*').single()
      if (error) {
        await supabase.storage.from('candidate-resumes').remove([storagePath])
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ candidate: data, extracted: parsed }, { status: 201 })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to parse resume.' }, { status: 500 })
    }
  }

  // Backward-compatible manual JSON intake.
  const body = await request.json()
  const fullName = asText(body.full_name)
  if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  const payload = {
    full_name: fullName, email: asText(body.email) || null, phone: asText(body.phone) || null, location: asText(body.location) || null,
    technology: asText(body.technology) || null, primary_skill: asText(body.primary_skill) || null, secondary_skills: asArray(body.secondary_skills),
    years_experience: asNumber(body.years_experience), industry: asText(body.industry) || null, current_company: asText(body.current_company) || null,
    previous_companies: asArray(body.previous_companies), notice_period_days: asNumber(body.notice_period_days), availability: asText(body.availability) || null,
    current_compensation: asNumber(body.current_compensation), expected_compensation: asNumber(body.expected_compensation), employment_type: asText(body.employment_type) || null,
    work_authorization: asText(body.work_authorization) || null, certifications: asArray(body.certifications), projects: asArray(body.projects), linkedin_url: asText(body.linkedin_url) || null,
    resume_storage_path: asText(body.resume_storage_path) || null, resume_file_name: asText(body.resume_file_name) || null, candidate_status: asText(body.candidate_status) || 'active',
    source: asText(body.source) || null, recruiter: asText(body.recruiter) || null, recruiter_notes: asText(body.recruiter_notes) || null, parse_status: 'not_uploaded',
  }
  const { data, error } = await supabase.from('talent_pool_candidates').insert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidate: data }, { status: 201 })
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
    text: asText(body.text), location: asText(body.location),
    skills: Array.isArray(body.skills) ? body.skills.map(asText).filter(Boolean) : asText(body.skills).split(',').map(s => s.trim()).filter(Boolean),
    experienceMin: Number(body.experienceMin || 0), noticeDays: body.noticeDays === undefined || body.noticeDays === '' ? undefined : Number(body.noticeDays),
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
