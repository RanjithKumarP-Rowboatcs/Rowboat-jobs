-- ROWBOAT portal extension. Safe to run after supabase/schema.sql.
-- Adds candidate/employer portal fields, employer job approvals, and private resume storage.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  resume_url text,
  linkedin_url text,
  company_name text,
  company_website text,
  role text not null default 'candidate' check (role in ('candidate','employer','admin')),
  employer_status text not null default 'pending' check (employer_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists resume_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists company_website text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists employer_status text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles enable row level security;
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update employer profiles" on public.profiles;
create policy "Admins can update employer profiles" on public.profiles for update to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

update public.profiles set role='candidate' where role is null or role not in ('candidate','employer','admin');
update public.profiles set employer_status='pending' where employer_status is null or employer_status not in ('pending','approved','rejected');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company_name, role, employer_status)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'company_name'), ''),
    case when new.raw_user_meta_data->>'requested_role' = 'employer' then 'employer' else 'candidate' end,
    'pending'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rowboat_profile on auth.users;
create trigger on_auth_user_created_rowboat_profile
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.jobs add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.jobs add column if not exists approval_status text;
update public.jobs set approval_status='approved' where approval_status is null;
alter table public.jobs alter column approval_status set default 'approved';
alter table public.jobs drop constraint if exists jobs_approval_status_check;
alter table public.jobs add constraint jobs_approval_status_check check (approval_status in ('pending','approved','rejected')) not valid;

alter table public.rowboat_applications add column if not exists candidate_id uuid references auth.users(id) on delete set null;

-- Keep existing jobs public while making the new employer approval workflow enforceable.
drop policy if exists "Public can read open jobs" on public.jobs;
create policy "Public can read open jobs"
on public.jobs for select to anon, authenticated
using (status = 'open' and approval_status = 'approved');

drop policy if exists "Admin can read all jobs" on public.jobs;
create policy "Admin can read all jobs"
on public.jobs for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

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

drop policy if exists "Employer can read own jobs" on public.jobs;
create policy "Employer can read own jobs"
on public.jobs for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer' and p.employer_status = 'approved') and created_by = auth.uid());

drop policy if exists "Employer can create approved jobs" on public.jobs;
create policy "Employer can create approved jobs"
on public.jobs for insert to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'employer' and created_by = auth.uid());

drop policy if exists "Admin can view rowboat applications" on public.rowboat_applications;
create policy "Admin can view rowboat applications"
on public.rowboat_applications for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Candidate can view own rowboat applications" on public.rowboat_applications;
create policy "Candidate can view own rowboat applications"
on public.rowboat_applications for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'candidate') and candidate_id = auth.uid());

drop policy if exists "Employer can view own job applications" on public.rowboat_applications;
create policy "Employer can view own job applications"
on public.rowboat_applications for select to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employer' and p.employer_status = 'approved')
  and exists (
    select 1 from public.jobs j
    where j.id = rowboat_applications.job_id and j.created_by = auth.uid()
  )
);

-- Private resume bucket.
insert into storage.buckets (id, name, public)
values ('candidate-resumes', 'candidate-resumes', false)
on conflict (id) do update set public = false;

drop policy if exists "Candidates can upload own resumes" on storage.objects;
create policy "Candidates can upload own resumes"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'candidate-resumes'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'candidate')
  and (storage.foldername(name))[1] = 'candidate-resumes'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Candidates can update own resumes" on storage.objects;
create policy "Candidates can update own resumes"
on storage.objects for update to authenticated
using (
  bucket_id = 'candidate-resumes'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'candidate-resumes'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Candidates can delete own resumes" on storage.objects;
create policy "Candidates can delete own resumes"
on storage.objects for delete to authenticated
using (
  bucket_id = 'candidate-resumes'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Authorized users can read resumes" on storage.objects;
create policy "Authorized users can read resumes"
on storage.objects for select to authenticated
using (
  bucket_id = 'candidate-resumes'
  and (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    or (storage.foldername(name))[2] = auth.uid()::text
    or exists (
      select 1
      from public.rowboat_applications a
      join public.jobs j on j.id = a.job_id
      where a.resume_url = 'storage:' || name
        and j.created_by = auth.uid()
    )
  )
);

-- Helpful indexes.
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_employer_status_idx on public.profiles(employer_status);
create index if not exists jobs_created_by_idx on public.jobs(created_by);
create index if not exists jobs_approval_status_idx on public.jobs(approval_status);
create index if not exists rowboat_applications_candidate_id_idx on public.rowboat_applications(candidate_id);
