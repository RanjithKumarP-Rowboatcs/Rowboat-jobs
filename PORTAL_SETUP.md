# ROWBOAT portal update — setup guide

This update keeps the existing Next.js + Supabase + Vercel application. It adds:

- One public website with Consulting + Talent + Opportunities.
- Candidate sign-up/login and candidate dashboard.
- Employer sign-up/login with admin approval.
- Employer company profile and job submission dashboard.
- Employer job submissions are `pending` until an admin approves them.
- Employer access to applications for their own approved jobs.
- Admin employer-approval tab and employer-job approval controls.
- Public homepage that pulls live approved jobs from the same Supabase-backed API.
- `/login`, `/candidate`, `/employer`, and `/admin` all on the same domain.

## Before changing anything

1. Do not delete the existing Vercel project.
2. Keep the existing GitHub repository and current working deployment as a backup.
3. Do not commit `.env` or `.env.local` files.

## Supabase — one-time SQL step

Open Supabase → SQL Editor and run the complete contents of:

`supabase/portal_schema.sql`

The SQL is designed as an extension to the existing `supabase/schema.sql`. Existing jobs are treated as approved so the current production jobs remain public.

Your existing administrator must still have:

`app_metadata.role = admin`

## Environment variables

The application only needs the public Supabase variables already used by the project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase service-role key in browser code.

## GitHub/Vercel update

The project remains compatible with GitHub → Vercel. Replace the repository files with this project and push the commit to `main`. Vercel should redeploy automatically because the existing Vercel project is already connected to that repository.

No paid Vercel feature is required by the added application code itself.

## First tests after deployment

1. Open `/` and confirm the homepage shows the Consulting section and live openings.
2. Open `/login` and create a Candidate account.
3. Open `/opportunities`, sign in when needed, and apply to a live job.
4. Open `/candidate` and confirm the profile/application appears.
5. Sign out and create an Employer account.
6. Open `/admin` and approve the employer under Employers.
7. Sign in again as the employer and submit a job.
8. In `/admin` → Requirements, approve the pending employer job.
9. Confirm the approved employer job appears on `/opportunities` and the home page.
10. Submit a candidate application and verify it appears in both Admin and the owning Employer portal.

## Files added/changed

Added:
- `app/login/page.tsx`
- `app/candidate/page.tsx`
- `app/employer/page.tsx`
- `app/api/profile/route.ts`
- `app/api/admin/employers/route.ts`
- `lib/supabase/authorization.ts`
- `supabase/portal_schema.sql`

Updated:
- `app/page.tsx`
- `app/admin/page.tsx`
- `app/admin/login/page.tsx`
- `app/admin/reset-password/page.tsx`
- `app/api/jobs/route.ts`
- `app/api/jobs/[id]/route.ts`
- `app/api/applications/route.ts`
- `app/api/applications/[id]/route.ts`
- `app/globals.css`
- `app/layout.tsx`
- `README.md`

Resume uploads
--------------
The candidate portal and signed-in candidate application form now support PDF/DOC/DOCX uploads up to 10 MB.
Run the full `supabase/portal_schema.sql` file once to create the private `candidate-resumes` storage bucket and its access policies.
Uploaded resumes are stored privately in Supabase Storage and opened through short-lived signed URLs after authorization checks.
Existing Google Drive/OneDrive/URL resume links continue to work.
