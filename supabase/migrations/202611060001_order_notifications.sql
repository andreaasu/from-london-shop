-- Run before deploying the new API. Existing orders are deliberately not emailed.
begin;
-- Checkout already uses service_role through /api/place-order. Block bypasses.
revoke insert on public.orders, public.order_items from anon, authenticated;
do $$
declare f record;
begin
  for f in select oid::regprocedure as signature from pg_proc
    where pronamespace = 'public'::regnamespace and proname = 'place_order'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end;
$$;
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
revoke all on public.order_notifications from anon, authenticated;
grant all on public.order_notifications to service_role;

create function public.enqueue_order_notifications() returns trigger
language plpgsql security definer set search_path = '' as $$
declare saved_order jsonb; saved_items jsonb;
begin
  select to_jsonb(o) into saved_order from public.orders o where o.id = new.id;
  select coalesce(jsonb_agg(to_jsonb(i) || jsonb_build_object('product_name', p.name) order by i.id), '[]'::jsonb)
    into saved_items from public.order_items i left join public.products p on p.id = i.product_id
    where i.order_id = new.id;
  insert into public.order_notifications(order_id, kind, snapshot)
    select new.id::text, k, jsonb_build_object('order', saved_order, 'items', saved_items)
    from unnest(array['customer','admin']) k on conflict (order_id, kind) do nothing;
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
