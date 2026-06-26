-- 0004 — publishing fee (AbacatePay). The platform's only revenue: a single
-- R$149,90 charge a couple pays to publish their site.
--
-- Gate: a wedding can only become 'published' after the fee is confirmed paid
-- by the AbacatePay webhook, which stamps weddings.publish_paid_at. The client
-- never sets this — only the (signature-checked) webhook does. Safe to re-run.

alter table public.weddings add column if not exists publish_paid_at timestamptz;

create table if not exists public.publish_payments (
  id                  uuid primary key default gen_random_uuid(),
  wedding_id          uuid not null references public.weddings (id) on delete cascade,
  provider            text not null default 'abacatepay',
  provider_charge_id  text unique,
  amount_cents        integer not null,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'expired', 'cancelled', 'refunded')),
  checkout_url        text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists publish_payments_wedding_id_idx on public.publish_payments (wedding_id);

alter table public.publish_payments enable row level security;

-- Owners (and admins) may read their wedding's publish payments. All writes are
-- server-only (service role / webhook), which bypasses RLS.
drop policy if exists publish_payments_select_via_owner on public.publish_payments;
create policy publish_payments_select_via_owner on public.publish_payments
  for select using (public.owns_wedding(wedding_id));
