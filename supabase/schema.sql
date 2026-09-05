-- ROWBOAT JOBS PLATFORM
-- Safe setup for an existing Supabase project.
-- This leaves the existing public.applications/opportunities tables untouched.
-- Run this once in Supabase SQL Editor.
-- After creating your Supabase Auth admin user, set its app_metadata to:
-- {"role":"admin"}

create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text,
  module text,
  industry text,
  location text,
  experience text,
  type text default 'Full-time',
  openings integer default 1,
  salary text,
  description text,
  requirements text,
  responsibilities text,
  skills text[] default '{}',
  apply_email text,
  reference_code text,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The project already has public.applications with opportunity_id/candidate_id.
-- Do not alter it. This separate table powers the new Rowboat jobs application flow.
create table if not exists public.rowboat_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  resume_url text,
  linkedin_url text,
  cover_letter text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_module_idx on public.jobs(module);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
create index if not exists rowboat_applications_job_id_idx on public.rowboat_applications(job_id);
create index if not exists rowboat_applications_created_at_idx on public.rowboat_applications(created_at desc);

alter table public.jobs enable row level security;
alter table public.rowboat_applications enable row level security;

grant select on public.jobs to anon, authenticated;
grant insert, update, delete on public.jobs to authenticated;
grant insert on public.rowboat_applications to anon, authenticated;
grant select, update, delete on public.rowboat_applications to authenticated;

drop policy if exists "Public can read open jobs" on public.jobs;
create policy "Public can read open jobs"
on public.jobs for select to anon, authenticated
using (status = 'open');

drop policy if exists "Admin can insert jobs" on public.jobs;
create policy "Admin can insert jobs"
on public.jobs for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can update jobs" on public.jobs;
create policy "Admin can update jobs"
on public.jobs for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can delete jobs" on public.jobs;
create policy "Admin can delete jobs"
on public.jobs for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public can submit rowboat applications" on public.rowboat_applications;
create policy "Public can submit rowboat applications"
on public.rowboat_applications for insert to anon, authenticated
with check (true);

drop policy if exists "Admin can view rowboat applications" on public.rowboat_applications;
create policy "Admin can view rowboat applications"
on public.rowboat_applications for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can update rowboat applications" on public.rowboat_applications;
create policy "Admin can update rowboat applications"
on public.rowboat_applications for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admin can delete rowboat applications" on public.rowboat_applications;
create policy "Admin can delete rowboat applications"
on public.rowboat_applications for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs
for each row execute function public.set_updated_at();

drop trigger if exists rowboat_applications_set_updated_at on public.rowboat_applications;
create trigger rowboat_applications_set_updated_at before update on public.rowboat_applications
for each row execute function public.set_updated_at();
