-- 0015 — fila e histórico do bot do Threads (scripts/threads-bot.mjs). Seguro para re-executar.
--
-- Um post por linha. O Claude Code gera o lote semanal (draft), o dono aprova
-- (approved) e o cron do VPS publica no máximo um por dia pela API oficial do
-- Threads (publishing → published, ou failed com o erro completo). A mesma tabela
-- é o histórico que o gerador consulta para não repetir texto, tema e fato.
--
-- Só o service_role (o VPS e o PC do dono, com a chave do .env) lê e escreve:
-- RLS ligada SEM nenhuma policy + privilégios revogados de anon/authenticated,
-- como em mp_connections (0010). O grant explícito ao service_role é necessário
-- porque, a partir de 30/10/2026, tabela nova no schema public deixa de receber
-- grants automáticos na Data API do Supabase.
--
-- Aplique no SQL Editor do Supabase.

create table if not exists public.threads_posts (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status            text not null default 'draft'
                      check (status in ('draft', 'approved', 'publishing', 'published', 'failed')),
  scheduled_for     date,                         -- primeiro dia (America/Sao_Paulo) em que o post pode sair
  pillar            text not null check (pillar in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6')),
  topic             text not null                 -- chave kebab-case do tema/subtema, para o descanso (ex.: confirmacao-prazo)
                      check (char_length(topic) between 1 and 120),
  text              text not null check (char_length(text) between 1 and 500),
  link_url          text                          -- vai como link_attachment, nunca dentro do texto
                      check (link_url is null or link_url like 'https://%'),
  topic_tag         text
                      check (topic_tag is null or (char_length(topic_tag) between 1 and 50 and topic_tag !~ '[.&]')),
  facts             text[] not null default '{}', -- ids da ficha .claude/skills/threads-lote/fatos.md
  container_id      text,
  threads_media_id  text,
  permalink         text,
  published_at      timestamptz,
  attempts          integer not null default 0,
  error             text                          -- erro completo da API/Supabase, sem segredos (até 4000 caracteres)
);
create index if not exists threads_posts_status_scheduled_idx on public.threads_posts (status, scheduled_for);

drop trigger if exists threads_posts_set_updated_at on public.threads_posts;
create trigger threads_posts_set_updated_at
  before update on public.threads_posts
  for each row execute function public.set_updated_at();

alter table public.threads_posts enable row level security;
revoke all on public.threads_posts from anon, authenticated;
grant select, insert, update, delete on public.threads_posts to service_role;
