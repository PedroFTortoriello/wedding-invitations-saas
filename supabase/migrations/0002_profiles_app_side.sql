-- 0002 — create profiles from the app, not from an auth.users trigger.
--
-- The 0001 trigger caused "Database error saving new user" on signup: its
-- SECURITY DEFINER insert into public.profiles is evaluated against profiles
-- RLS during the GoTrue signup transaction, where auth.uid() is null, so the
-- insert is denied and the whole signup aborts.
--
-- Fix: drop the trigger and create the profile from the app immediately after
-- signup, when the user already has a session (auth.uid() = their id), guarded
-- by a self-insert RLS policy. Safe to re-run.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Allow an authenticated user to create their OWN profile row (id must match
-- their auth uid). Combined with the existing profiles_update_self policy, the
-- app can upsert its profile.
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());
