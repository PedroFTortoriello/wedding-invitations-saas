-- 0012 — WhatsApp opcional do casal, guardado na CONTA (profiles), nunca no conteúdo
-- público do site. O casal deixa o número no editor ("Ajuda pelo WhatsApp") para a
-- equipe da Noivar poder oferecer ajuda com o site. Não há aviso automático por
-- WhatsApp hoje: se um dia houver, o texto do opt-in precisa mudar antes.
--
-- LGPD: dado pessoal com finalidade única (contato de suporte), consentido pelo
-- próprio titular. Leitura só do dono e do admin (profiles_select_self_or_admin,
-- 0001); nunca vai para funnel_events, analytics ou o site público. Formato E.164
-- só com dígitos (55 + DDD + número), normalizado pelo app antes de gravar.
--
-- Safe to re-run: idempotente.

alter table public.profiles
  add column if not exists whatsapp text
    constraint profiles_whatsapp_format check (whatsapp ~ '^[0-9]{12,13}$');

-- A 0007 trocou o GRANT de tabela por colunas: sem isto o update do app é negado.
grant update (whatsapp) on public.profiles to authenticated;

comment on column public.profiles.whatsapp is
  'WhatsApp opcional do casal para contato do suporte (E.164, só dígitos). LGPD: finalidade única de suporte; leitura só do dono e do admin; nunca em funnel_events, analytics ou site público.';
