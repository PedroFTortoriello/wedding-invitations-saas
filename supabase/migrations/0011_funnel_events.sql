-- Funil e erros do produto, com retenção própria (os logs da Vercel duram ~1h no
-- plano atual). O servidor grava marcos da jornada (cadastro, casamento criado,
-- checkout, pagamento, publicação) e falhas de ações, para responder "onde o casal
-- parou e por quê". Escrita só pelo servidor (service role, sem policy de insert);
-- leitura só por admin. Nunca guarde e-mail, chave Pix ou documento em `detail`.
--
-- Também garante UM casamento por conta (regra do MVP já seguida pelo app), o que
-- torna idempotente a criação automática do casamento logo após o cadastro.
--
-- Safe to re-run: idempotente.

create table if not exists public.funnel_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  wedding_id  uuid references public.weddings (id) on delete set null,
  event       text not null check (char_length(event) <= 64),
  level       text not null default 'info' check (level in ('info', 'error')),
  path        text check (char_length(path) <= 300),
  detail      jsonb not null default '{}'::jsonb
);

create index if not exists funnel_events_user_idx on public.funnel_events (user_id, created_at desc);
create index if not exists funnel_events_wedding_idx on public.funnel_events (wedding_id, created_at desc);
create index if not exists funnel_events_event_idx on public.funnel_events (event, created_at desc);

alter table public.funnel_events enable row level security;

drop policy if exists funnel_events_admin_read on public.funnel_events;
create policy funnel_events_admin_read on public.funnel_events
  for select using (public.is_admin());

-- Retenção (LGPD, necessidade): identificadores de anúncio só servem para a Conversions
-- API logo após o evento (checkout → pagamento). O cron diário (/api/cron/keep-alive)
-- apaga essas chaves de eventos com mais de 30 dias; o resto do evento fica.
create or replace function public.purge_funnel_ad_ids()
returns void
language sql
security definer
set search_path = public
as $$
  update public.funnel_events
     set detail = detail - array['fbp', 'fbc', 'userAgent', 'fbclid', 'gclid']
   where created_at < now() - interval '30 days'
     and detail ?| array['fbp', 'fbc', 'userAgent', 'fbclid', 'gclid'];
$$;

revoke all on function public.purge_funnel_ad_ids() from public, anon, authenticated;
grant execute on function public.purge_funnel_ad_ids() to service_role;

-- Um casamento por conta. Falha se já houver dono com dois casamentos: nesse caso,
-- resolva os duplicados antes de rodar esta migration.
create unique index if not exists weddings_owner_id_key on public.weddings (owner_id);
