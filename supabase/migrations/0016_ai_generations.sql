-- 0016 — "Site feito pela IA". Seguro para re-executar.
--
-- Cada linha é uma geração do site pela IA (Claude) a partir do briefing do casal.
-- Ter ao menos uma linha muda o preço da publicação para o valor do plano com IA
-- (o checkout consulta esta tabela) e o número de linhas limita quantas vezes o
-- casal pode gerar. Por isso só o servidor (service_role) escreve: RLS ligada SEM
-- policy de escrita, e o casal só lê as próprias linhas. Grants explícitos porque
-- tabela nova no schema public deixa de receber grants automáticos na Data API.
--
-- Aplique no SQL Editor do Supabase.

create table if not exists public.ai_generations (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings (id) on delete cascade,
  model          text not null,
  briefing       jsonb not null default '{}'::jsonb,   -- o que o casal mandou (pré-preenche a próxima geração)
  input_tokens   integer,
  output_tokens  integer,
  created_at     timestamptz not null default now()
);
create index if not exists ai_generations_wedding_id_idx on public.ai_generations (wedding_id);

alter table public.ai_generations enable row level security;

drop policy if exists ai_generations_select_via_owner on public.ai_generations;
create policy ai_generations_select_via_owner on public.ai_generations
  for select using (public.owns_wedding(wedding_id));

revoke all on public.ai_generations from anon, authenticated;
grant select on public.ai_generations to authenticated;
grant all on public.ai_generations to service_role;
