-- Acesso da cerimonialista (Nível 1): link só-leitura por token.
-- O dono gera/revoga o token no painel; a rota pública /coordenacao/[token]
-- resolve o casamento pelo token via service-role (server-only), então nenhuma
-- policy nova de RLS é necessária — o token é o segredo de acesso. Vale para
-- rascunho e publicado (a cerimonialista organiza antes de o site ir ao ar).
--
-- Safe to re-run: idempotente.
alter table public.weddings
  add column if not exists coordinator_token text;

-- NULLs contam como distintos, então múltiplos casamentos sem token convivem.
create unique index if not exists weddings_coordinator_token_key
  on public.weddings (coordinator_token);
