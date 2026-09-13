import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getAuthContext } from '../../../lib/supabase/authorization'
import { analyzeResume, extractResumeText } from '../../../lib/talent/resume-parser'
import { calculateExperience } from '../../../lib/talent/experience'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function staffOnly(role: string | null) { return role === 'admin' || role === 'super_admin' || role === 'recruiter' }
function text(value: unknown) { return typeof value === 'string' ? value.trim() : '' }
function array(value: unknown) { if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean); return text(value).split(',').map(v => v.trim()).filter(Boolean) }
function number(value: unknown) { if (value === '' || value == null) return null; const n = Number(value); return Number.isFinite(n) ? n : null }
function formText(form: FormData, key: string, fallback?: string) { return text(form.get(key)) || fallback || null }
function formArray(form: FormData, key: string, fallback: string[]) { const value = text(form.get(key)); return value ? array(value) : fallback }
function formNumber(form: FormData, key: string, fallback?: number) { const value = form.get(key); return value == null || text(value) === '' ? (fallback ?? null) : number(value) }

async function poolCandidates(supabase: any) {
  const { data, error } = await supabase.from('talent_pool_candidates').select('*').order('updated_at', { ascending: false }).limit(500)
  if (error) return { candidates: [], error }
  return { candidates: (data || []).map((c: any) => ({ candidate_id: c.id, talent: { technology: c.technology, primary_skill: c.primary_skill, secondary_skills: c.secondary_skills || [], industry: c.industry, previous_companies: c.previous_companies || [], employment_type: c.employment_type, work_authorization: c.work_authorization, certifications: c.certifications || [], projects: c.projects || [], education: c.education_text || [], technical_responsibilities: c.technical_responsibilities || [], management_responsibilities: c.management_responsibilities || [], achievements: c.achievements_text || [], current_role: c.candidate_current_role, relevant_experience_years: c.relevant_experience_years, availability: c.availability, ai_generated_skill_profile: c.ai_summary, candidate_status: c.candidate_status, source: c.source, recruiter: c.recruiter, recruiter_notes: c.recruiter_notes }, profile: { id: c.id, full_name: c.full_name, email: c.email, phone: c.phone, location: c.location, current_company: c.current_company, experience_years: c.years_experience, notice_period_days: c.notice_period_days, resume_url: c.resume_storage_path ? `storage:${c.resume_storage_path}` : null, linkedin_url: c.linkedin_url, current_ctc: c.current_compensation, expected_ctc: c.expected_compensation } })), error: null }
}

function score(candidate: any, requirement: { location?: string; skills?: string[]; experienceMin?: number; noticeDays?: number }) {
  const haystack = [candidate.profile?.full_name, candidate.profile?.location, candidate.profile?.current_company, candidate.talent?.technology, candidate.talent?.primary_skill, ...(candidate.talent?.secondary_skills || []), ...(candidate.talent?.certifications || []), ...(candidate.talent?.projects || []), candidate.talent?.industry].filter(Boolean).join(' ').toLowerCase()
  const requested = (requirement.skills || []).map(s => s.toLowerCase()).filter(Boolean)
  const matched = requested.filter(s => haystack.includes(s))
  let value = 45
  if (requested.length) value += Math.min(30, (matched.length / requested.length) * 30)
  const location = text(candidate.profile?.location).toLowerCase()
  const wanted = text(requirement.location).toLowerCase()
  if (wanted && location.includes(wanted)) value += 15
  const experience = Number(candidate.profile?.experience_years || 0)
  if (requirement.experienceMin && experience >= requirement.experienceMin) value += 7
  const notice = Number(candidate.profile?.notice_period_days)
  if (requirement.noticeDays != null && Number.isFinite(notice) && notice <= requirement.noticeDays) value += 3
  return Math.max(0, Math.min(99, Math.round(value)))
}

export async function GET(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })
  const search = request.nextUrl.searchParams.get('search')?.trim().toLowerCase() || ''
  const pool = await poolCandidates(supabase)
  if (pool.error) return NextResponse.json({ error: pool.error.message }, { status: 500 })
  let candidates = pool.candidates
  if (search) candidates = candidates.filter((c: any) => JSON.stringify(c).toLowerCase().includes(search))
  return NextResponse.json({ candidates, total: candidates.length })
}

export async function PUT(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })
  const form = await request.formData()
  const file = form.get('resume')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Please select a resume file.' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Resume must be 10 MB or smaller.' }, { status: 400 })

  const ext = file.name.toLowerCase().split('.').pop() || ''
  const mime = file.type === 'application/pdf' || ext === 'pdf' ? 'application/pdf' : file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : file.type === 'application/msword' || ext === 'doc' ? 'application/msword' : ''
  if (!mime) return NextResponse.json({ error: 'Unsupported resume format. Please upload PDF, DOCX or DOC.' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const rawText = await extractResumeText(buffer, mime)
    if (!rawText || rawText.length < 30) return NextResponse.json({ error: 'The resume text could not be read. Please upload a text-based PDF, DOCX or DOC.' }, { status: 400 })

    const parsed = analyzeResume(rawText)
    const experience = calculateExperience(rawText, parsed)
    parsed.experienceYears = experience.total
    parsed.relevantExperienceYears = experience.relevant
    if (!parsed.fullName) return NextResponse.json({ error: 'I could not confidently find the candidate name. Please check the resume.' }, { status: 400 })

    if (text(form.get('preview')) === 'true') return NextResponse.json({ extracted: parsed, experience_calculation: { total_years: experience.total, relevant_years: experience.relevant, source: experience.source } })

    const candidateId = randomUUID()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const storagePath = `talent-pool/${candidateId}/${safeName}`
    const upload = await supabase.storage.from('candidate-resumes').upload(storagePath, buffer, { contentType: mime, upsert: false })
    if (upload.error) return NextResponse.json({ error: `Resume storage failed: ${upload.error.message}` }, { status: 500 })

    const skills = formArray(form, 'secondary_skills', parsed.secondarySkills)
    const primarySkill = formText(form, 'primary_skill', parsed.primarySkill)
    const candidate = { id: candidateId, full_name: formText(form, 'full_name', parsed.fullName), email: formText(form, 'email', parsed.email), phone: formText(form, 'phone', parsed.phone), location: formText(form, 'location', parsed.location), technology: formText(form, 'technology', parsed.technology), primary_skill: primarySkill, secondary_skills: skills, years_experience: formNumber(form, 'years_experience', parsed.experienceYears), relevant_experience_years: formNumber(form, 'relevant_experience_years', parsed.relevantExperienceYears), industry: formText(form, 'industry', parsed.industry), current_company: formText(form, 'current_company', parsed.currentCompany), candidate_current_role: formText(form, 'current_role', parsed.currentRole), previous_companies: formArray(form, 'previous_companies', parsed.previousCompanies), notice_period_days: formNumber(form, 'notice_period_days', parsed.noticePeriodDays), availability: formText(form, 'availability', parsed.noticePeriodDays === 0 ? 'Immediate' : parsed.noticePeriodDays != null ? `${parsed.noticePeriodDays} days` : undefined), current_compensation: formNumber(form, 'current_compensation', parsed.currentCompensation), expected_compensation: formNumber(form, 'expected_compensation', parsed.expectedCompensation), employment_type: formText(form, 'employment_type', parsed.employmentType), work_authorization: formText(form, 'work_authorization', parsed.workAuthorization), certifications: formArray(form, 'certifications', parsed.certifications), projects: formArray(form, 'projects', parsed.projects), education_text: formArray(form, 'education', parsed.education), technical_responsibilities: formArray(form, 'technical_responsibilities', parsed.technicalResponsibilities), management_responsibilities: formArray(form, 'management_responsibilities', parsed.managementResponsibilities), achievements_text: formArray(form, 'achievements', parsed.achievements), linkedin_url: formText(form, 'linkedin_url', parsed.linkedinUrl), resume_storage_path: storagePath, resume_file_name: file.name, resume_text: parsed.text, ai_summary: parsed.aiSummary, ai_extracted_skills: [primarySkill, ...skills].filter(Boolean), ai_certifications: parsed.certifications, parse_status: 'completed', parse_error: null, candidate_status: text(form.get('candidate_status')) || 'active', source: text(form.get('source')) || 'Resume upload', recruiter: text(form.get('recruiter')) || null, recruiter_notes: text(form.get('recruiter_notes')) || null }

    const { data, error } = await supabase.from('talent_pool_candidates').insert(candidate).select('*').single()
    if (error) { await supabase.storage.from('candidate-resumes').remove([storagePath]); return NextResponse.json({ error: error.message }, { status: 500 }) }
    return NextResponse.json({ candidate: data, extracted: parsed }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to parse resume.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Recruiter/admin access required' }, { status: 403 })
  const body = await request.json()
  const candidateId = text(body.candidate_id)
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
  const requirement = { location: text(body.location), skills: Array.isArray(body.skills) ? body.skills.map(text).filter(Boolean) : text(body.skills).split(',').map(s => s.trim()).filter(Boolean), experienceMin: Number(body.experienceMin || 0), noticeDays: body.noticeDays === undefined || body.noticeDays === '' ? undefined : Number(body.noticeDays) }
  const pool = await poolCandidates(supabase)
  if (pool.error) return NextResponse.json({ error: pool.error.message }, { status: 500 })
  const matches = pool.candidates.map((candidate: any) => ({ ...candidate, score: score(candidate, requirement) })).sort((a: any, b: any) => b.score - a.score).slice(0, 25)
  return NextResponse.json({ matches, requirement })
}
