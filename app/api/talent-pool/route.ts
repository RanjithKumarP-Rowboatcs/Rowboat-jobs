import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function staffOnly(role: string | null) {
  return role === 'admin' || role === 'super_admin' || role === 'recruiter'
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalized(value: unknown) {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function digits(value: unknown) {
  return text(value).replace(/\D/g, '')
}

function searchable(candidate: any) {
  return [
    candidate.full_name,
    candidate.email,
    candidate.phone,
    candidate.country,
    candidate.state,
    candidate.city,
    candidate.metro_area,
    candidate.location,
    candidate.technology,
    candidate.primary_skill,
    ...(candidate.secondary_skills || []),
    candidate.industry,
    candidate.current_company,
    candidate.candidate_current_role,
    ...(candidate.previous_companies || []),
    ...(candidate.certifications || []),
    ...(candidate.projects || []),
    ...(candidate.education_text || []),
    ...(candidate.technical_responsibilities || []),
    ...(candidate.management_responsibilities || []),
    ...(candidate.achievements_text || []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function mapCandidate(c: any) {
  return {
    candidate_id: c.id,
    talent: {
      technology: c.technology,
      primary_skill: c.primary_skill,
      secondary_skills: c.secondary_skills || [],
      industry: c.industry,
      previous_companies: c.previous_companies || [],
      employment_type: c.employment_type,
      work_authorization: c.work_authorization,
      certifications: c.certifications || [],
      projects: c.projects || [],
      education: c.education_text || c.education || [],
      technical_responsibilities: c.technical_responsibilities || [],
      management_responsibilities: c.management_responsibilities || [],
      achievements: c.achievements_text || c.achievements || [],
      current_role: c.candidate_current_role || c.current_role,
      relevant_experience_years: c.relevant_experience_years,
      availability: c.availability,
      ai_generated_skill_profile: c.ai_summary,
      candidate_status: c.candidate_status,
      source: c.source,
      recruiter: c.recruiter,
      recruiter_notes: c.recruiter_notes,
    },
    profile: {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone,
      location: c.location,
      country: c.country,
      state: c.state,
      city: c.city,
      metro_area: c.metro_area,
      current_company: c.current_company,
      experience_years: c.years_experience,
      relevant_experience_years: c.relevant_experience_years,
      notice_period_days: c.notice_period_days,
      resume_url: c.resume_storage_path ? `storage:talent-pool/${c.id}/${c.resume_file_name || c.resume_storage_path.split('/').pop() || ''}` : null,
      resume_file_name: c.resume_file_name,
      linkedin_url: c.linkedin_url,
      current_ctc: c.current_compensation,
      expected_ctc: c.expected_compensation,
      candidate_status: c.candidate_status,
    },
  }
}

async function getRows(supabase: any) {
  const { data, error } = await supabase
    .from('talent_pool_candidates')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1000)

  if (error) throw new Error(error.message)
  return data || []
}

export async function GET(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Admin/recruiter access required' }, { status: 403 })

  try {
    let rows = await getRows(supabase)
    const q = normalized(request.nextUrl.searchParams.get('search'))

    if (q) rows = rows.filter((row: any) => searchable(row).includes(q))

    // Prevent duplicate profiles from being shown when the same person was uploaded more than once.
    const seen = new Set<string>()
    rows = rows.filter((row: any) => {
      const email = normalized(row.email)
      const phone = digits(row.phone)
      const name = normalized(row.full_name)
      const identity = email ? `email:${email}` : phone ? `phone:${phone}` : `name:${name}`
      if (!identity || seen.has(identity)) return false
      seen.add(identity)
      return true
    })

    return NextResponse.json({ candidates: rows.map(mapCandidate), total: rows.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load talent database' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (!staffOnly(role)) return NextResponse.json({ error: 'Admin/recruiter access required' }, { status: 403 })

  try {
    const body = await request.json()
    const candidateId = text(body?.candidate_id)
    if (!candidateId) return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 })

    const { data: candidate, error: readError } = await supabase
      .from('talent_pool_candidates')
      .select('id, resume_storage_path, full_name')
      .eq('id', candidateId)
      .maybeSingle()

    if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

    const { error: deleteError } = await supabase
      .from('talent_pool_candidates')
      .delete()
      .eq('id', candidateId)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    if (candidate.resume_storage_path) {
      const { error: storageError } = await supabase.storage
        .from('candidate-resumes')
        .remove([candidate.resume_storage_path])

      if (storageError) {
        return NextResponse.json({
          warning: 'Profile deleted, but the stored resume could not be removed automatically.',
          candidate_id: candidateId,
          resume_error: storageError.message,
        }, { status: 200 })
      }
    }

    return NextResponse.json({ deleted: true, candidate_id: candidateId, full_name: candidate.full_name })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to permanently delete candidate' }, { status: 500 })
  }
}
