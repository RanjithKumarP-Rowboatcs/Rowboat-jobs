import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

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
  const patch = {
    full_name: String(input.full_name || '').trim() || null,
    phone: String(input.phone || '').trim() || null,
    resume_url: String(input.resume_url || '').trim() || null,
    linkedin_url: String(input.linkedin_url || '').trim() || null,
    company_name: String(input.company_name || '').trim() || null,
    company_website: String(input.company_website || '').trim() || null,
  }

  const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let talent = null
  if (role === 'candidate') {
    const talentPatch = {
      technology: String(input.technology || '').trim() || null,
      primary_skill: String(input.primary_skill || '').trim() || null,
      secondary_skills: Array.isArray(input.secondary_skills) ? input.secondary_skills.map((v: any) => String(v).trim()).filter(Boolean) : String(input.secondary_skills || '').split(',').map(v => v.trim()).filter(Boolean),
      industry: String(input.industry || '').trim() || null,
      previous_companies: Array.isArray(input.previous_companies) ? input.previous_companies.map((v: any) => String(v).trim()).filter(Boolean) : String(input.previous_companies || '').split(',').map(v => v.trim()).filter(Boolean),
      employment_type: String(input.employment_type || '').trim() || null,
      work_authorization: String(input.work_authorization || '').trim() || null,
      certifications: Array.isArray(input.certifications) ? input.certifications.map((v: any) => String(v).trim()).filter(Boolean) : String(input.certifications || '').split(',').map(v => v.trim()).filter(Boolean),
      projects: Array.isArray(input.projects) ? input.projects.map((v: any) => String(v).trim()).filter(Boolean) : String(input.projects || '').split(',').map(v => v.trim()).filter(Boolean),
      availability: String(input.availability || '').trim() || null,
    }
    const { data: talentData, error: talentError } = await supabase.from('talent_profiles').upsert({ candidate_id: user.id, ...talentPatch }).select('technology,primary_skill,secondary_skills,industry,previous_companies,employment_type,work_authorization,certifications,projects,availability').single()
    if (talentError) return NextResponse.json({ error: talentError.message }, { status: 500 })
    talent = talentData
  }
  return NextResponse.json({ profile: data, talent })
}
