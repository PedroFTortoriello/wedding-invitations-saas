-- 0005 — enforce the publish-fee invariant at the DATABASE layer (not just routes).
--
-- RLS is row-level, not column-level: weddings_update_own (0001) would otherwise
-- let an authenticated couple set publish_paid_at or status='published' directly
-- with the anon key, bypassing payment. Two guards close that:
--   1) a BEFORE UPDATE trigger that forbids anon/authenticated clients from
--      touching publish_paid_at or flipping status to 'published';
--   2) mark_publish_paid(), a SECURITY DEFINER RPC callable ONLY by service_role
--      (the webhook), which marks a wedding paid atomically, bound to a real
--      pending charge and the correct amount, idempotently.
-- Safe to re-run.

-- 1) Column-freeze trigger ----------------------------------------------------
create or replace function public.guard_wedding_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  -- Only restrict the browser-facing roles; service_role and direct DB are trusted.
  if v_role in ('authenticated', 'anon') then
    if new.publish_paid_at is distinct from old.publish_paid_at then
      raise exception 'publish_paid_at is set only by the payment webhook';
    end if;
    if new.status = 'published' and old.status is distinct from 'published' then
      raise exception 'a site can only be published after the publishing fee is paid';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists weddings_guard_publish on public.weddings;
create trigger weddings_guard_publish
  before update on public.weddings
  for each row execute function public.guard_wedding_publish();

-- 2) Atomic, charge-bound, idempotent "mark paid" RPC -------------------------
-- Returns true when the wedding is (now or already) paid for a charge we created
-- at the correct amount; false when the charge is unknown/mismatched (caller acks
-- without retry). Any DB error propagates so the caller can ask for a retry.
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

  update public.publish_payments set status = 'paid', paid_at = now() where id = pay.id;
  update public.weddings set publish_paid_at = coalesce(publish_paid_at, now()) where id = p_wedding_id;
  return true;
end;
$$;

-- Only the webhook (service_role) may mark a wedding paid.
revoke all on function public.mark_publish_paid(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.mark_publish_paid(text, uuid, integer) to service_role;
