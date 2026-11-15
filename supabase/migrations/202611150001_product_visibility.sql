begin;
set local lock_timeout = '5s';
alter table public.products
  add column if not exists is_visible boolean not null default true;
commit;
