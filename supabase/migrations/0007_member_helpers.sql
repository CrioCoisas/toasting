-- Toasting — Helper RPC for reading the current member with auth context.
-- Bypasses RLS (SECURITY DEFINER) so the auth callback / member queries
-- never hit policy edge cases when the session is brand new.

create or replace function get_current_member()
returns table (
  id uuid,
  tenant_id uuid,
  tier_id uuid,
  email text,
  name text,
  phone text,
  photo_url text,
  status text,
  joined_at timestamptz,
  valid_until timestamptz,
  tier_name text,
  tier_discount_percent numeric,
  tier_max_uses_per_day int,
  tier_color text,
  tenant_name text,
  tenant_slug text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    m.id, m.tenant_id, m.tier_id, m.email, m.name, m.phone, m.photo_url,
    m.status, m.joined_at, m.valid_until,
    tr.name as tier_name,
    tr.discount_percent as tier_discount_percent,
    tr.max_uses_per_day as tier_max_uses_per_day,
    tr.color as tier_color,
    t.name as tenant_name,
    t.slug as tenant_slug
  from members m
  join tiers tr on tr.id = m.tier_id
  join tenants t on t.id = m.tenant_id
  where m.auth_user_id = auth.uid()
$$;

revoke all on function get_current_member() from public;
grant execute on function get_current_member() to authenticated, anon;
