# ROWBOAT CONSULTING SERVICES

Full-stack company + consulting + recruitment platform built with Next.js, TypeScript and Supabase.

## Current platform
- Public company website at `/`
- Live opportunities at `/opportunities`
- Candidate / employer authentication at `/login`
- Candidate dashboard at `/candidate`
- Employer dashboard at `/employer`
- Administrator at `/admin`
- Supabase-backed jobs and applications
- Employer job submissions require admin approval before publication
- Existing admin-created jobs remain approved for backward compatibility

## First-time Supabase setup
1. Keep your existing `supabase/schema.sql` applied.
2. Run `supabase/portal_schema.sql` once in the Supabase SQL Editor.
3. Keep your existing Supabase Auth admin user and its `app_metadata.role = admin`.
4. Configure only the public Supabase URL/publishable key in the deployment environment.

## Required environment variables
Copy `.env.example` to `.env.local` for local development and supply:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Deployment
The project remains suitable for Vercel + GitHub + Supabase. Push this source to the connected GitHub repository and let Vercel deploy it. No Vercel Pro-only feature is required by the application code.

## Portal workflow
- Candidate: create account → build profile → browse/apply → track applications.
- Employer: create account → await admin approval → maintain company profile → submit jobs → jobs enter pending review → admin approves → job becomes public.
- Admin: manage jobs, applications and employer approvals.

## Important
Do not commit `.env` or `.env.local` files. Never put Supabase secrets or service-role keys in browser code.
