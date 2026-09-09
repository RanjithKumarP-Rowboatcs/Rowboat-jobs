const SUPABASE_URL = 'https://zpcnottwgelfiuqulioc.supabase.co'

// The Supabase project URL and publishable key are public client configuration.
// Keep a safe fallback so a missing Vercel environment variable cannot break
// the public site or portal after deployment.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-z9K2Amqv7SXSVhdldvPcQ_jimCOmb2'

export function getSupabaseUrl() {
  return SUPABASE_URL
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || SUPABASE_PUBLISHABLE_KEY
}
