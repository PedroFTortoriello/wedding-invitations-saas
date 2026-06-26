-- 0003 — reconcile with this project's pre-existing schema.
--
-- The project already had BOTH a public.profiles table (id, email, created_at,
-- updated_at) AND a public.user_role enum whose values differ from mine (the
-- default 'client' was rejected: "invalid input value for enum user_role").
-- Because 0001 guarded type/table creation with "if exists"/duplicate_object,
-- it silently kept the project's objects instead of mine.
--
-- Fix: stop depending on custom enums entirely. Move every status/role column
-- to text + CHECK (collision-proof), and add the profiles columns the app needs.
-- Non-destructive (existing rows kept) and safe to re-run.

set check_function_bodies = off;

-- ---- profiles: add app columns; role as TEXT (not the colliding enum) -------
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('client', 'admin'));

-- ---- weddings/guests/cash_gifts: convert enum status columns to text --------
alter table public.weddings alter column status drop default;
alter table public.weddings alter column status type text using status::text;
alter table public.weddings alter column status set default 'draft';
alter table public.weddings drop constraint if exists weddings_status_check;
alter table public.weddings add constraint weddings_status_check
  check (status in ('draft', 'published', 'suspended', 'expired'));

alter table public.guests alter column status drop default;
alter table public.guests alter column status type text using status::text;
alter table public.guests alter column status set default 'pending';
alter table public.guests drop constraint if exists guests_status_check;
alter table public.guests add constraint guests_status_check
  check (status in ('pending', 'confirmed', 'declined'));

alter table public.cash_gifts alter column status drop default;
alter table public.cash_gifts alter column status type text using status::text;
alter table public.cash_gifts alter column status set default 'pending';
alter table public.cash_gifts drop constraint if exists cash_gifts_status_check;
alter table public.cash_gifts add constraint cash_gifts_status_check
  check (status in ('pending', 'paid', 'refunded'));

-- ---- profiles RLS: reset to exactly the app's policies ----------------------
alter table public.profiles enable row level security;
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
