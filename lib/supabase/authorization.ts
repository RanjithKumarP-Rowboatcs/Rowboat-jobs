import { createClient } from './server'

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: any
  role: 'admin' | 'employer' | 'candidate' | null
  profile: any
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null, profile: null }

  // Support both app_metadata and the existing Rowboat roles table.
  const metadataRole = user.app_metadata?.role
  if (metadataRole === 'admin' || metadataRole === 'super_admin') {
    return { supabase, user, role: 'admin', profile: null }
  }

  const { data: roleRow } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleRow?.role === 'admin' || roleRow?.role === 'super_admin') {
    return { supabase, user, role: 'admin', profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role === 'employer' ? 'employer' : 'candidate'
  return { supabase, user, role, profile }
}

export function isApprovedEmployer(
  role: AuthContext['role'],
  profile: any,
) {
  return role === 'employer' && profile?.employer_status === 'approved'
}
