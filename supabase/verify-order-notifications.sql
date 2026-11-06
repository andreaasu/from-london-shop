-- READ ONLY. Run this first and share all result sets. No customer rows are read.
select p.oid::regprocedure::text as signature,
       pg_get_userbyid(p.proowner) as owner,
       l.lanname as language, p.prosecdef as security_definer,
       p.proconfig as settings, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.proname in ('place_order', 'enqueue_order_notifications', 'claim_order_notifications')
  and p.prokind = 'f';

select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('orders', 'order_items', 'products', 'order_notifications')
order by table_name, ordinal_position;

select c.relname as table_name, t.tgname,
       pg_get_triggerdef(t.oid) as trigger_definition,
       pg_get_functiondef(t.tgfoid) as trigger_function_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('orders', 'order_items')
  and not t.tgisinternal;

select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('orders', 'order_items', 'products');

select to_regclass('public.order_notifications') as queue_table,
       to_regprocedure('public.enqueue_order_notifications()') as enqueue_function,
       to_regprocedure('public.claim_order_notifications(text,integer)') as claim_function;

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename in ('orders', 'order_items', 'products');
