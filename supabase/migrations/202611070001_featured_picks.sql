-- Apply manually when ready. No order, stock, policy or checkout changes.
begin;
set local lock_timeout = '5s';
alter table public.products
  add column is_featured boolean not null default false,
  add column featured_order integer not null default 0 check (featured_order >= 0);
commit;
