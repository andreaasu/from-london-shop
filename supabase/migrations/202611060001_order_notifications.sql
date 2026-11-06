-- MANUAL ONLY: first run ../verify-order-notifications.sql and verify place_order
-- inserts orders + all order_items within one transaction. No existing-order backfill.
-- Must be run as an authorized database owner (e.g. Supabase SQL Editor postgres).
-- Do not change existing checkout grants, policies, or place_order.
begin;
set local lock_timeout = '5s';
create table public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  kind text not null check (kind in ('customer', 'admin')),
  snapshot jsonb not null,
  message jsonb,
  status text not null default 'pending' check (status in ('pending','sending','sent','skipped','review')),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  resend_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, kind)
);
create index order_notifications_due on public.order_notifications(next_attempt_at) where status in ('pending','sending');
alter table public.order_notifications enable row level security;
revoke all on public.order_notifications from public, anon, authenticated;
grant all on public.order_notifications to service_role;

create function public.enqueue_order_notifications() returns trigger
language plpgsql security definer set search_path = '' as $$
declare saved_order jsonb; saved_items jsonb;
begin
  select to_jsonb(o) into saved_order from public.orders o where o.id = new.id;
  select coalesce(jsonb_agg(to_jsonb(i) || jsonb_build_object('product_name', p.name) order by i.id), '[]'::jsonb)
    into saved_items from public.order_items i left join public.products p on p.id = i.product_id
    where i.order_id = new.id;
  if saved_order is null or jsonb_array_length(saved_items) = 0 then
    raise exception 'Notification snapshot is incomplete';
  end if;
  insert into public.order_notifications(order_id, kind, snapshot)
    select new.id::text, k, jsonb_build_object('order', saved_order, 'items', saved_items)
    from unnest(array['customer','admin']) k on conflict (order_id, kind) do nothing;
  return new;
exception when others or query_canceled or assert_failure then
  -- This exception block rolls back ONLY this enqueue operation. Never discard
  -- the customer's order because the optional notification queue failed.
  -- Do not include SQLERRM or customer fields in logs.
  -- Includes optional enqueue cancellation; fatal connection/database failures and
  -- errors elsewhere in the order transaction cannot be isolated by this handler.
  raise warning 'order_notification_enqueue_failed order_id=% sqlstate=%', new.id, SQLSTATE;
  return new;
end;
$$;
-- Deferred until transaction commit: place_order has inserted all line items by then.
create constraint trigger order_notifications_enqueue after insert on public.orders
  deferrable initially deferred for each row execute function public.enqueue_order_notifications();
revoke all on function public.enqueue_order_notifications() from public, anon, authenticated;

create function public.claim_order_notifications(p_order_id text default null, p_limit integer default 10)
returns setof public.order_notifications
language plpgsql security definer set search_path = '' as $$
begin
  -- Allow daily cron recovery for seven days. Uncertain SMTP sends remain in review.
  update public.order_notifications set status = 'review', last_error = 'Retry window exhausted; reconcile with Gmail before retrying'
    where status in ('pending','sending') and first_attempt_at < now() - interval '7 days'
    and (lease_until is null or lease_until < now());
  return query
    with candidates as (
      select id from public.order_notifications
      where status in ('pending','sending') and next_attempt_at <= now()
        and (lease_until is null or lease_until < now())
        and (p_order_id is null or order_id = p_order_id)
      order by created_at, id for update skip locked limit greatest(1, least(p_limit, 10))
    )
    update public.order_notifications n set status = 'sending', attempts = attempts + 1,
      first_attempt_at = coalesce(first_attempt_at, now()), lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes'
    from candidates c where n.id = c.id returning n.*;
end;
$$;
revoke all on function public.claim_order_notifications(text, integer) from public, anon, authenticated;
grant execute on function public.claim_order_notifications(text, integer) to service_role;
commit;
