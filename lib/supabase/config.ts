const DEFAULT_SUPABASE_URL = 'https://zpcnottwgelfiuqulioc.supabase.co'

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  return value && /^https?:\/\//i.test(value) ? value : DEFAULT_SUPABASE_URL
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || ''
}
