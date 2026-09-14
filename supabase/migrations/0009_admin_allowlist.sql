-- 0009 — semear administradores por e-mail. Seguro para re-executar.
--
-- `profiles.role` só pode ser definido pelo servidor (service_role) ou por um
-- gatilho SECURITY DEFINER: a 0007 revogou a coluna do cliente. Este gatilho
-- promove e-mails da allowlist a 'admin' no momento em que o perfil é criado,
-- cobrindo os DOIS caminhos de criação — o trigger handle_new_user (0001) e o
-- upsert feito pelo app em ensureProfile (0002) — já que ambos escrevem em
-- public.profiles. Também protege a conta semente contra rebaixamento acidental
-- pela UI, pois o BEFORE UPDATE reaplica 'admin'.

create or replace function public.enforce_admin_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = any (array[
    'pedrooofreitas@gmail.com'
  ]) then
    new.role := 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_admin_allowlist on public.profiles;
create trigger profiles_admin_allowlist
  before insert or update on public.profiles
  for each row execute function public.enforce_admin_allowlist();

-- Promove a conta caso ela já exista (o trigger cobre criações futuras).
update public.profiles
  set role = 'admin'
  where lower(email) = 'pedrooofreitas@gmail.com'
    and role <> 'admin';
