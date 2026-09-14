-- 0007 — endurecimento de segurança. Seguro para re-executar.
--
--  1) profiles.role: RLS é por LINHA, não por coluna — profiles_update_self (0001)
--     deixava o usuário editar o próprio `role` e virar 'admin', destravando
--     is_admin() e o acesso a TODOS os inquilinos. Como no Postgres um GRANT de
--     tabela cobre todas as colunas, para restringir `role` é preciso remover o
--     privilégio de tabela e reconceder só as colunas seguras.
--  2) pix_holder_document: PII (CPF/CNPJ) protegida apenas por seleção de colunas
--     no app, sobre uma policy que devolve sites publicados ao anon. Nenhum caminho
--     grava/lê essa coluna hoje — dropá-la elimina o vazamento latente de vez.

-- 1) O cliente nunca define role (só o trigger handle_new_user, SECURITY DEFINER,
--    e o service_role). Insert/Update ficam restritos às colunas não sensíveis.
revoke insert on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant insert (id, email, name) on public.profiles to authenticated;
grant update (email, name) on public.profiles to authenticated;

-- 2) Remove a coluna PII morta (server-only, nunca populada).
alter table public.weddings drop column if exists pix_holder_document;
