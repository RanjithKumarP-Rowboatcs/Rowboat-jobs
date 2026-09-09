import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '../../../lib/supabase/authorization'

export const dynamic = 'force-dynamic'

const BUCKET = 'candidate-resumes'
const PREFIX = 'storage:candidate-resumes/'
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function safeFileName(name: string) {
  return (
    name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'resume'
  )
}

export async function POST(request: NextRequest) {
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  if (role !== 'candidate') return NextResponse.json({ error: 'Only candidates can upload resumes.' }, { status: 403 })

  const form = await request.formData()
  const entry = form.get('file')
  if (!(entry instanceof File)) return NextResponse.json({ error: 'Choose a resume file first.' }, { status: 400 })
  if (!ALLOWED.has(entry.type)) return NextResponse.json({ error: 'Only PDF, DOC and DOCX resumes are supported.' }, { status: 400 })
  if (entry.size > MAX_SIZE) return NextResponse.json({ error: 'The resume must be 10 MB or smaller.' }, { status: 400 })

  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `candidate-resumes/${user.id}/${unique}-${safeFileName(entry.name)}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, entry, { contentType: entry.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const resumeUrl = `storage:${path}`
  const { data: profile, error: profileError } = await supabase.from('profiles').update({ resume_url: resumeUrl }).eq('id', user.id).select('*').single()
  if (profileError) {
    await supabase.storage.from(BUCKET).remove([path])
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ resume_url: resumeUrl, file_name: entry.name, profile })
}

export async function GET(request: NextRequest) {
  const rawPath = request.nextUrl.searchParams.get('path') || ''
  if (!rawPath.startsWith(PREFIX)) return NextResponse.json({ error: 'Invalid resume path' }, { status: 400 })
  const path = rawPath.slice('storage:'.length)
  const { supabase, user, role } = await getAuthContext()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  if (role === 'candidate' && !path.startsWith(`candidate-resumes/${user.id}/`)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  if (role === 'employer') {
    const { data: application } = await supabase.from('rowboat_applications')
      .select('id,job_id,resume_url,jobs!inner(created_by)')
      .eq('resume_url', rawPath).eq('jobs.created_by', user.id).maybeSingle()
    if (!application) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  if (!['admin', 'candidate', 'employer'].includes(role)) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10)
  if (error || !data?.signedUrl) return NextResponse.json({ error: error?.message || 'Unable to open resume' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl, { status: 302 })
}
