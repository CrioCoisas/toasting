-- Toasting — Initial schema (multi-tenant by design)
-- Run this in Supabase SQL Editor after creating the project.

-- ============================================================
-- TABLES
-- ============================================================

-- Tenants: each customer organization (a restaurant group).
create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Venues: individual restaurants belonging to a tenant.
create table venues (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  address text,
  phone text,
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- Tiers: membership levels (Friends, Staff, Press, Partner).
create table tiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  discount_percent numeric(5,2) not null
    check (discount_percent >= 0 and discount_percent <= 100),
  max_uses_per_day int not null default 1,
  validity_days int,
  color text,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- Members: the people who get the discount.
create table members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  tier_id uuid not null references tiers(id) on delete restrict,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  photo_url text,
  status text not null default 'active'
    check (status in ('active','paused','revoked')),
  joined_at timestamptz not null default now(),
  valid_until timestamptz,
  invited_by_admin_id uuid,
  unique (tenant_id, email)
);

-- Admins: tenant managers (the restaurant group owners).
create table admins (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'manager'
    check (role in ('owner','manager')),
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

-- Staff: waiters/hosts who validate codes inside a venue.
create table staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Invites: one-time/limited links to onboard members.
create table invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  tier_id uuid not null references tiers(id) on delete restrict,
  code text unique not null,
  max_uses int not null default 1,
  used_count int not null default 0,
  expires_at timestamptz,
  created_by_admin_id uuid references admins(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Redemptions: generated 6-digit codes + usage log (single table by design).
create table redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  code text not null,
  status text not null default 'pending'
    check (status in ('pending','used','expired','cancelled')),
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  venue_id uuid references venues(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  applied_percent numeric(5,2)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index members_tenant_idx on members (tenant_id);
create index members_auth_idx on members (auth_user_id);
create index admins_auth_idx on admins (auth_user_id);
create index redemptions_member_status_idx on redemptions (member_id, status);
create index redemptions_pending_code_idx on redemptions (code)
  where status = 'pending';
create index redemptions_used_at_idx on redemptions (member_id, redeemed_at)
  where status = 'used';

-- ============================================================
-- TRIGGER: ensure at most ONE pending redemption per member
-- ============================================================

create or replace function ensure_single_pending_code()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'pending' then
    update redemptions
       set status = 'cancelled'
     where member_id = new.member_id
       and status = 'pending'
       and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger trg_single_pending_code
before insert on redemptions
for each row execute function ensure_single_pending_code();

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================

-- Returns the tenant_id of the currently authenticated user (member OR admin).
create or replace function auth_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from admins where auth_user_id = auth.uid()
  union all
  select tenant_id from members where auth_user_id = auth.uid()
  limit 1
$$;

-- True if the current user is an admin.
create or replace function auth_is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from admins where auth_user_id = auth.uid())
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table tenants     enable row level security;
alter table venues      enable row level security;
alter table tiers       enable row level security;
alter table members     enable row level security;
alter table admins      enable row level security;
alter table staff       enable row level security;
alter table invites     enable row level security;
alter table redemptions enable row level security;

-- Tenants: read your own.
create policy "tenants_self_read"
  on tenants for select
  using (id = auth_tenant_id());

-- Venues: any member of the tenant can read active venues.
create policy "venues_tenant_read"
  on venues for select
  using (tenant_id = auth_tenant_id());

create policy "venues_admin_write"
  on venues for all
  using (auth_is_admin() and tenant_id = auth_tenant_id())
  with check (auth_is_admin() and tenant_id = auth_tenant_id());

-- Tiers: any member of the tenant can read.
create policy "tiers_tenant_read"
  on tiers for select
  using (tenant_id = auth_tenant_id());

create policy "tiers_admin_write"
  on tiers for all
  using (auth_is_admin() and tenant_id = auth_tenant_id())
  with check (auth_is_admin() and tenant_id = auth_tenant_id());

-- Members: member sees own row; admin sees all in tenant.
create policy "members_read_own"
  on members for select
  using (auth_user_id = auth.uid());

create policy "members_admin_all"
  on members for all
  using (auth_is_admin() and tenant_id = auth_tenant_id())
  with check (auth_is_admin() and tenant_id = auth_tenant_id());

create policy "members_update_own_profile"
  on members for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Admins: only admins of the tenant can see admins.
create policy "admins_tenant_read"
  on admins for select
  using (auth_is_admin() and tenant_id = auth_tenant_id());

-- Invites: admin manages; reading by code is done via service-role on signup.
create policy "invites_admin_all"
  on invites for all
  using (auth_is_admin() and tenant_id = auth_tenant_id())
  with check (auth_is_admin() and tenant_id = auth_tenant_id());

-- Redemptions: member sees/creates own; admin sees all in tenant.
create policy "redemptions_member_read_own"
  on redemptions for select
  using (
    exists (
      select 1 from members m
       where m.id = redemptions.member_id
         and m.auth_user_id = auth.uid()
    )
  );

create policy "redemptions_member_create_own"
  on redemptions for insert
  with check (
    exists (
      select 1 from members m
       where m.id = redemptions.member_id
         and m.auth_user_id = auth.uid()
         and m.status = 'active'
         and m.tenant_id = redemptions.tenant_id
    )
  );

create policy "redemptions_admin_all"
  on redemptions for all
  using (auth_is_admin() and tenant_id = auth_tenant_id())
  with check (auth_is_admin() and tenant_id = auth_tenant_id());

-- Staff: admin manages. Waiter validation will go through a server action
-- with service-role key (PIN-based, not Supabase Auth).
create policy "staff_admin_all"
  on staff for all
  using (
    auth_is_admin()
    and exists (
      select 1 from venues v
       where v.id = staff.venue_id
         and v.tenant_id = auth_tenant_id()
    )
  )
  with check (
    auth_is_admin()
    and exists (
      select 1 from venues v
       where v.id = staff.venue_id
         and v.tenant_id = auth_tenant_id()
    )
  );
