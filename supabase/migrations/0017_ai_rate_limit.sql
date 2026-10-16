-- 0017 — Limite de uso do "Site feito pela IA" por IP e por dia. Seguro para re-executar.
--
-- Cada geração chama o Claude com o briefing e até 12 fotos antes de qualquer pagamento, e
-- criar conta é grátis: o limite por casamento (MAX_AI_GENERATIONS, contado em
-- ai_generations) não segura quem cria várias contas. Esta tabela registra cada TENTATIVA
-- de geração (antes de chamar a IA, porque uma falha também consome tokens) e a função
-- ai_claim_attempt decide, de forma atômica, se ela pode seguir.
--
-- LGPD: o IP nunca é gravado. O app grava só um HMAC-SHA256 da rede (o IPv4 inteiro ou o
-- prefixo /64 do IPv6), que serve para contar tentativas da mesma rede e não permite
-- recuperar o endereço sem a chave do servidor (é dado pseudonimizado, não anônimo). Sem
-- ligação com a conta: a linha não guarda quem pediu. As linhas são apagadas depois de 2
-- dias (a própria função limpa). Finalidade única: prevenir abuso da IA (legítimo
-- interesse, art. 7º, IX), descrita na política de privacidade.
--
-- Só o servidor (service_role) lê e escreve: RLS ligada sem policy, grants explícitos.
-- Aplique no SQL Editor do Supabase antes do deploy que chama ai_claim_attempt.

create table if not exists public.ai_attempts (
  id          bigint generated always as identity primary key,
  ip_hash     text not null check (char_length(ip_hash) between 16 and 128),
  created_at  timestamptz not null default now()
);
create index if not exists ai_attempts_ip_created_idx on public.ai_attempts (ip_hash, created_at);
create index if not exists ai_attempts_created_idx on public.ai_attempts (created_at);

alter table public.ai_attempts enable row level security;
revoke all on public.ai_attempts from anon, authenticated;
grant all on public.ai_attempts to service_role;

comment on table public.ai_attempts is
  'Tentativas de geração do site pela IA, para limitar por IP e por dia. Guarda só o HMAC do IP; linhas apagadas após 2 dias.';

-- Decide e registra a tentativa numa transação só. Retorna:
--   'ok'    a tentativa foi registrada e a geração pode seguir;
--   'ip'    esta rede (ip_hash) já fez p_per_ip tentativas nas últimas 24 h;
--   'daily' a plataforma inteira já fez p_per_day tentativas nas últimas 24 h.
-- O advisory lock serializa as chamadas (volume baixo): dois pedidos simultâneos não
-- passam juntos pelo mesmo limite.
create or replace function public.ai_claim_attempt(p_ip_hash text, p_per_ip integer, p_per_day integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n_day integer;
  n_ip  integer;
begin
  perform pg_advisory_xact_lock(hashtext('public.ai_claim_attempt'));
  delete from public.ai_attempts where created_at < now() - interval '2 days';

  select count(*) into n_day from public.ai_attempts where created_at > now() - interval '1 day';
  if n_day >= p_per_day then
    return 'daily';
  end if;

  select count(*) into n_ip
    from public.ai_attempts
   where ip_hash = p_ip_hash and created_at > now() - interval '1 day';
  if n_ip >= p_per_ip then
    return 'ip';
  end if;

  insert into public.ai_attempts (ip_hash) values (p_ip_hash);
  return 'ok';
end;
$$;

revoke all on function public.ai_claim_attempt(text, integer, integer) from public, anon, authenticated;
grant execute on function public.ai_claim_attempt(text, integer, integer) to service_role;

-- O WhatsApp passou a ser pedido no cadastro (contas antigas seguem com ele opcional no
-- editor). Atualiza o comentário da 0012, que ainda dizia "opcional" e "consentido".
comment on column public.profiles.whatsapp is
  'WhatsApp do casal (E.164, só dígitos), pedido no cadastro; contas antigas: opcional no editor. Finalidade: falar com o casal sobre o site e o pagamento. LGPD: execução do contrato (art. 7º, V); leitura só do dono e do admin; nunca em funnel_events, analytics ou site público.';
