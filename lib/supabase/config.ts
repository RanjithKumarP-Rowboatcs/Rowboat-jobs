const SUPABASE_URL = 'https://zpcnottwgelfiuqulioc.supabase.co'

// The Supabase project URL is public configuration. Keep it fixed here so a
// malformed Vercel environment value can never take the admin site offline.
export function getSupabaseUrl() {
  return SUPABASE_URL
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || ''
}
