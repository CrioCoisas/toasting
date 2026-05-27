-- Toasting — Fix RLS recursion.
-- The helper functions auth_tenant_id() and auth_is_admin() were causing
-- "stack depth limit exceeded" because they SELECT from admins/members,
-- and those tables have policies that call these same functions.
-- SECURITY DEFINER makes them run with owner privileges, bypassing RLS internally.

create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tenant_id from admins where auth_user_id = auth.uid()
  union all
  select tenant_id from members where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function auth_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from admins where auth_user_id = auth.uid())
$$;

-- Lock function ownership so callers can't override them.
revoke all on function auth_tenant_id() from public;
revoke all on function auth_is_admin() from public;
grant execute on function auth_tenant_id() to authenticated, anon;
grant execute on function auth_is_admin() to authenticated, anon;
