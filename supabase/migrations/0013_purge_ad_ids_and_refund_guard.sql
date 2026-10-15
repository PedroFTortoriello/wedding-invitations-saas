-- 0013 — o que ficou de fora da 0011 aplicada em produção + reembolso que não volta.
--
-- 1) purge_funnel_ad_ids(): a 0011 foi editada depois da primeira versão ir para
--    produção, e a função nunca chegou ao banco (o cron diário recebia PGRST202).
--    A /privacidade promete apagar _fbp/_fbc/user agent/fbclid/gclid após 30 dias.
-- 2) weddings_owner_id_key: mesmo caso (um casamento por conta). Arquivo separado:
--    0014, para uma conta duplicada não impedir a retenção acima.
-- 3) mark_publish_paid(): uma cobrança marcada 'refunded' (reembolso manual) não
--    pode voltar a 'paid' se a AbacatePay reenviar o webhook — isso republicava o
--    site sozinho. Runbook de reembolso (service role): publish_payments.status =
--    'refunded', weddings.publish_paid_at = null e weddings.status = 'draft'.
--
-- Safe to re-run: idempotente.

-- 1) Retenção dos identificadores de anúncio -----------------------------------
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

-- 3) Cobrança reembolsada não é reaplicada ------------------------------------
create or replace function public.mark_publish_paid(
  p_charge_id text,
  p_wedding_id uuid,
  p_amount_cents integer default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.publish_payments%rowtype;
begin
  select * into pay
    from public.publish_payments
    where provider_charge_id = p_charge_id
    for update;

  if not found then
    return false;                                   -- not a charge we created
  end if;
  if pay.wedding_id <> p_wedding_id then
    return false;                                   -- externalId does not match the charge
  end if;
  if p_amount_cents is not null and pay.amount_cents <> p_amount_cents then
    return false;                                   -- underpaid / tampered amount
  end if;
  if pay.status = 'paid' then
    return true;                                    -- idempotent: already applied
  end if;
  if pay.status = 'refunded' then
    return false;                                   -- refunded: a redelivery must not re-mark paid
  end if;

  update public.publish_payments set status = 'paid', paid_at = now() where id = pay.id;
  update public.weddings set publish_paid_at = coalesce(publish_paid_at, now()) where id = p_wedding_id;
  return true;
end;
$$;

revoke all on function public.mark_publish_paid(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.mark_publish_paid(text, uuid, integer) to service_role;
