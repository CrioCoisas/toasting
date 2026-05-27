-- Toasting — Invite flow RPCs.
-- Members need to read an invite to render the signup page BEFORE they
-- have an auth session, and consume it atomically AFTER signup.
-- These SECURITY DEFINER functions allow that without loosening RLS.

-- Preview: returns invite metadata for the signup screen.
-- Returns NULL if the code doesn't exist, has been fully consumed, or expired.
create or replace function preview_invite(p_code text)
returns table (
  tenant_name text,
  tier_name text,
  discount_percent numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.name as tenant_name,
    tr.name as tier_name,
    tr.discount_percent
    from invites i
    join tenants t on t.id = i.tenant_id
    join tiers tr on tr.id = i.tier_id
   where i.code = p_code
     and i.used_count < i.max_uses
     and (i.expires_at is null or i.expires_at > now())
$$;

revoke all on function preview_invite(text) from public;
grant execute on function preview_invite(text) to anon, authenticated;

-- Consume: caller must be authenticated. Atomically creates the member
-- row and bumps the invite's used_count. Raises on any validation error.
create or replace function consume_invite(
  p_code text,
  p_name text,
  p_phone text default null,
  p_photo_url text default null
)
returns members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_invite invites%rowtype;
  v_member members;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;
  if v_user_email is null then
    raise exception 'auth_user_not_found';
  end if;

  -- Row-level lock to avoid races on max_uses.
  select * into v_invite from invites where code = p_code for update;
  if not found then
    raise exception 'invite_not_found';
  end if;

  if v_invite.used_count >= v_invite.max_uses then
    raise exception 'invite_exhausted';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite_expired';
  end if;

  insert into members (
    tenant_id, tier_id, auth_user_id, email, name, phone, photo_url, status
  )
  values (
    v_invite.tenant_id, v_invite.tier_id, v_user_id, v_user_email,
    p_name, p_phone, p_photo_url, 'active'
  )
  returning * into v_member;

  update invites set used_count = used_count + 1 where id = v_invite.id;

  return v_member;
end;
$$;

revoke all on function consume_invite(text, text, text, text) from public;
grant execute on function consume_invite(text, text, text, text) to authenticated;

-- Seed: one invite for the pilot tenant's "Amigos" tier with 5 uses (lets
-- Amanda create test accounts during MVP). Code: PILOT-TEST.
with t as (select id as tenant_id from tenants where slug = 'grupo-piloto'),
     tr as (select id as tier_id from tiers where slug = 'amigos')
insert into invites (tenant_id, tier_id, code, max_uses, expires_at)
select t.tenant_id, tr.tier_id, 'PILOT-TEST', 5, now() + interval '90 days'
  from t, tr
on conflict (code) do nothing;
