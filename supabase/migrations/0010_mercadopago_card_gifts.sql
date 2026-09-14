-- 0010 — presentes no cartão via Mercado Pago (Split 1:1 / OAuth). Seguro para re-executar.
--
-- Sem custódia: cada casal conecta a PRÓPRIA conta Mercado Pago (OAuth) e a
-- cobrança do cartão é criada com o token dele — o dinheiro cai direto na conta
-- do casal, nunca na da plataforma. Guardamos só o necessário para criar as
-- cobranças e conferir os pagamentos no webhook.
--
--  1) mp_connections: 1 conexão por casamento. Os tokens são cifrados na aplicação
--     (AES-256-GCM, MERCADOPAGO_TOKEN_ENCRYPTION_KEY) e a tabela é inacessível ao browser:
--     RLS ligada SEM nenhuma policy + privilégios revogados de anon/authenticated.
--     Só o service_role (rotas do servidor) lê e escreve.
--  2) cash_gifts: colunas do pagamento no cartão + status 'failed' (recusado).
--  3) cash_gifts passa a ser gravável por coluna: o casal (authenticated) só marca
--     recebido (status/paid_at) — e nunca num presente de cartão, que só o webhook
--     confirma. Insert e demais colunas: só service_role.

-- 1) Conexão OAuth do casal ------------------------------------------------------
create table if not exists public.mp_connections (
  wedding_id         uuid primary key references public.weddings (id) on delete cascade,
  mp_user_id         text not null,                -- user_id do casal no Mercado Pago (collector)
  access_token_enc   text not null,                -- cifrado (secret-box.ts)
  refresh_token_enc  text not null,                -- cifrado (secret-box.ts)
  public_key         text,
  scope              text,
  live_mode          boolean not null default true,
  expires_at         timestamptz not null,         -- validade do access_token (~180 dias)
  mp_nickname        text,
  mp_email           text,
  status             text not null default 'active'
                       check (status in ('active', 'revoked', 'error')),
  fee_payer          text not null default 'guest' -- quem paga a taxa do cartão
                       check (fee_payer in ('guest', 'couple')),
  last_error         text,
  connected_at       timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists mp_connections_mp_user_id_idx on public.mp_connections (mp_user_id);
create index if not exists mp_connections_expires_at_idx on public.mp_connections (expires_at) where status = 'active';

drop trigger if exists mp_connections_set_updated_at on public.mp_connections;
create trigger mp_connections_set_updated_at
  before update on public.mp_connections
  for each row execute function public.set_updated_at();

alter table public.mp_connections enable row level security;
revoke all on public.mp_connections from anon, authenticated;

-- 2) cash_gifts ------------------------------------------------------------------
-- Um valor novo de enum não pode ser USADO na mesma transação que o cria; esta
-- migration não usa 'failed' em lugar nenhum (só a aplicação, depois).
alter type public.cash_gift_status add value if not exists 'failed';

alter table public.cash_gifts
  add column if not exists provider            text,           -- 'mercadopago' (null = Pix direto na chave)
  add column if not exists provider_payment_id text,           -- id do pagamento no Mercado Pago
  add column if not exists provider_status     text,           -- status/status_detail cru do MP
  add column if not exists charged_amount      numeric(12, 2), -- o que o convidado pagou (presente + taxa, sem juros)
  add column if not exists net_amount          numeric(12, 2), -- líquido creditado ao casal pelo MP
  add column if not exists installments        integer,
  add column if not exists gift_id             text;           -- cota do site (content.gifts[].id)

-- Um pagamento do MP vira no máximo UM presente (idempotência do webhook).
-- NULLs não colidem num unique, então os presentes Pix (sem id) seguem livres.
do $$ begin
  alter table public.cash_gifts add constraint cash_gifts_provider_payment_id_key unique (provider_payment_id);
exception when duplicate_table or duplicate_object then null; end $$;

-- 3) Escrita por coluna + guard ----------------------------------------------------
-- RLS é por linha: sem isto o casal poderia gravar provider_payment_id de um
-- pagamento alheio e travar a conciliação (unique). Inserts são do servidor.
revoke insert, update on public.cash_gifts from anon, authenticated;
grant update (status, paid_at) on public.cash_gifts to authenticated;

create or replace function public.guard_card_gift()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  -- Só restringe os papéis do browser; service_role (webhook) e o banco são confiáveis.
  if v_role in ('authenticated', 'anon') and old.provider is not null then
    raise exception 'presentes no cartão são confirmados só pelo webhook do Mercado Pago';
  end if;
  return new;
end;
$$;

drop trigger if exists cash_gifts_guard_card on public.cash_gifts;
create trigger cash_gifts_guard_card
  before update on public.cash_gifts
  for each row execute function public.guard_card_gift();
