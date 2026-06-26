-- Vows — auth + multi-tenant foundation
-- Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh project.
-- Multi-tenancy is enforced at the database layer via RLS: a user can only
-- read/write their own weddings (owner_id = auth.uid()); published weddings are
-- publicly readable (for the guest-facing site); admins (profiles.role='admin')
-- can read everything.
--
-- Safe to re-run: every statement is idempotent (if not exists / or replace /
-- drop ... if exists).

-- Allow functions that reference tables created later in this script (e.g.
-- is_admin() -> profiles); their bodies are validated at runtime instead of
-- at creation time.
set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.wedding_status as enum ('draft', 'published', 'suspended', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cash_gift_status as enum ('pending', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.guest_status as enum ('pending', 'confirmed', 'declined');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so the admin check does not recurse through RLS on profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  name        text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Wrapped so the migration still completes even if this project restricts
-- triggers on auth.users. If it is skipped, the app creates the profile from
-- the signup flow instead (upsert into public.profiles).
do $$
begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when others then
  raise notice 'skipping auth.users trigger (%): profiles will be created from the app on signup.', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- weddings (owned by a user). Rich content kept in JSONB; queryable columns
-- (slug, status, owner_id, couple_names, pix_key) are promoted to columns.
-- ---------------------------------------------------------------------------
create table if not exists public.weddings (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  slug          text not null unique,
  status        public.wedding_status not null default 'draft',
  couple_names  text not null,
  pix_key       text,
  pix_key_type  text,
  pix_holder_name text,
  pix_holder_document text, -- server-only PII (CPF/CNPJ); never exposed to the public site
  content       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists weddings_owner_id_idx on public.weddings (owner_id);
create index if not exists weddings_status_idx on public.weddings (status);

drop trigger if exists weddings_set_updated_at on public.weddings;
create trigger weddings_set_updated_at
  before update on public.weddings
  for each row execute function public.set_updated_at();

alter table public.weddings enable row level security;

-- Published weddings are world-readable (guest-facing site); owners see their
-- own drafts; admins see all.
drop policy if exists weddings_select on public.weddings;
create policy weddings_select on public.weddings
  for select using (status = 'published' or owner_id = auth.uid() or public.is_admin());

drop policy if exists weddings_insert_own on public.weddings;
create policy weddings_insert_own on public.weddings
  for insert with check (owner_id = auth.uid());

drop policy if exists weddings_update_own on public.weddings;
create policy weddings_update_own on public.weddings
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists weddings_delete_own on public.weddings;
create policy weddings_delete_own on public.weddings
  for delete using (owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Child tables (guests, messages, cash_gifts) — scoped through their wedding.
-- ---------------------------------------------------------------------------
create table if not exists public.guests (
  id                    uuid primary key default gen_random_uuid(),
  wedding_id            uuid not null references public.weddings (id) on delete cascade,
  name                  text not null,
  contact               text,
  status                public.guest_status not null default 'pending',
  companions_allowed    integer not null default 0,
  companions_confirmed  integer not null default 0,
  dietary_restriction   text,
  note                  text,
  created_at            timestamptz not null default now()
);
create index if not exists guests_wedding_id_idx on public.guests (wedding_id);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  guest_name  text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists messages_wedding_id_idx on public.messages (wedding_id);

create table if not exists public.cash_gifts (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references public.weddings (id) on delete cascade,
  guest_name      text not null,
  message         text,
  gross_amount    numeric(12, 2) not null check (gross_amount >= 1),
  currency        text not null default 'BRL',
  status          public.cash_gift_status not null default 'pending',
  payment_method  text not null default 'pix',
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists cash_gifts_wedding_id_idx on public.cash_gifts (wedding_id);

alter table public.guests enable row level security;
alter table public.messages enable row level security;
alter table public.cash_gifts enable row level security;

-- A row in a child table is accessible iff the caller owns its wedding (or is admin).
create or replace function public.owns_wedding(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.weddings w
    where w.id = target and (w.owner_id = auth.uid() or public.is_admin())
  );
$$;

drop policy if exists guests_all_via_owner on public.guests;
create policy guests_all_via_owner on public.guests
  for all using (public.owns_wedding(wedding_id)) with check (public.owns_wedding(wedding_id));

drop policy if exists messages_all_via_owner on public.messages;
create policy messages_all_via_owner on public.messages
  for all using (public.owns_wedding(wedding_id)) with check (public.owns_wedding(wedding_id));

drop policy if exists cash_gifts_all_via_owner on public.cash_gifts;
create policy cash_gifts_all_via_owner on public.cash_gifts
  for all using (public.owns_wedding(wedding_id)) with check (public.owns_wedding(wedding_id));
