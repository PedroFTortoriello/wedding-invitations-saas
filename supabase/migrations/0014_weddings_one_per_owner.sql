-- 0014 — um casamento por conta (índice que estava só na versão editada da 0011).
-- O app já segue a regra; o índice fecha a corrida de duas abas/dois cliques na
-- criação automática (wedding-create.ts trata o 23505 de owner_id).
--
-- Falha se já houver dono com dois casamentos. Antes de rodar, confira:
--   select owner_id, count(*) from public.weddings group by owner_id having count(*) > 1;
--
-- Safe to re-run: idempotente.

create unique index if not exists weddings_owner_id_key on public.weddings (owner_id);
