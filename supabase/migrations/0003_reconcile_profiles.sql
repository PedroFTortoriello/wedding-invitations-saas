-- 0003 — reconcile a pre-existing profiles table with the app's schema.
--
-- This project already had a public.profiles table (columns: id, email,
-- created_at, updated_at), so 0001's `create table if not exists` skipped it
-- and never added the app's `name` / `role` columns (signup then failed with
-- "Could not find the 'name' column" / "column profiles.role does not exist").
--
-- Non-destructive: we ADD the missing columns (existing rows/data are kept) and
-- reset profiles' RLS policies to exactly the app's set. Safe to re-run.

set check_function_bodies = off;

-- 1) Add the columns the app needs (idempotent; defaults backfill existing rows).
alter table public.profiles add column if not exists role public.user_role not null default 'client';
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;

alter table public.profiles enable row level security;

-- 2) Drop ANY existing policies on profiles (including an over-permissive
-- public-read one the pre-existing table may have shipped), then recreate
-- exactly the app's policies: read self-or-admin, update self, insert self.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());
