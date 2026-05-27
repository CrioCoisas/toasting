-- Toasting — Loosen RLS for marketing-level data + fix Café encoding.
-- Venues, tiers, and tenants contain non-sensitive info (restaurant names,
-- discount % displayed to the public). Making them publicly readable lets
-- the landing page and unauthenticated flows work.
-- Sensitive tables (members, admins, invites, redemptions, staff) keep
-- their strict policies.

drop policy if exists "venues_tenant_read" on venues;
create policy "venues_public_read"
  on venues for select
  using (active = true);

drop policy if exists "tiers_tenant_read" on tiers;
create policy "tiers_public_read"
  on tiers for select
  using (true);

drop policy if exists "tenants_self_read" on tenants;
create policy "tenants_public_read"
  on tenants for select
  using (true);

-- Fix encoding for "Café 18 do Forte" — chr(233) avoids Monaco editor's
-- copy-paste mangling of non-ASCII characters in the SQL editor.
update venues
   set name = 'Caf' || chr(233) || ' 18 do Forte'
 where slug = 'cafe-18-forte';
