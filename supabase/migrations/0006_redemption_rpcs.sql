-- Toasting — Redemption code generation.
-- Centralizes all business rules (cooldown, 1×/day, expiry, uniqueness)
-- in a single SECURITY DEFINER function callable by authenticated members.

-- Uniqueness among currently-pending codes only. Used codes can repeat over
-- time, but two members can't have the same active code simultaneously.
create unique index if not exists redemptions_unique_pending_code
  on redemptions (code)
  where status = 'pending';

create or replace function generate_redemption_code()
returns redemptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_member members%rowtype;
  v_tier tiers%rowtype;
  v_uses_today int;
  v_last_used timestamptz;
  v_cooldown interval := interval '5 minutes';
  v_validity interval := interval '5 minutes';
  v_code text;
  v_attempts int := 0;
  v_redemption redemptions;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_member from members where auth_user_id = v_user_id;
  if not found then
    raise exception 'member_not_found';
  end if;
  if v_member.status <> 'active' then
    raise exception 'member_not_active';
  end if;
  if v_member.valid_until is not null and v_member.valid_until < now() then
    raise exception 'membership_expired';
  end if;

  select * into v_tier from tiers where id = v_member.tier_id;

  -- Daily limit (counted in São Paulo local date to match user expectation).
  select count(*) into v_uses_today
    from redemptions
   where member_id = v_member.id
     and status = 'used'
     and (redeemed_at at time zone 'America/Sao_Paulo')::date
         = (now() at time zone 'America/Sao_Paulo')::date;

  if v_uses_today >= v_tier.max_uses_per_day then
    raise exception 'daily_limit_reached';
  end if;

  -- Cooldown after most recent use.
  select max(redeemed_at) into v_last_used
    from redemptions
   where member_id = v_member.id
     and status = 'used';

  if v_last_used is not null and v_last_used > now() - v_cooldown then
    raise exception 'cooldown_active';
  end if;

  -- Generate a unique 6-digit code. The trigger ensure_single_pending_code
  -- will cancel any prior pending code on insert. Retry on rare collision
  -- with another member's pending code.
  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    v_attempts := v_attempts + 1;
    begin
      insert into redemptions (
        tenant_id, member_id, code, status, expires_at
      )
      values (
        v_member.tenant_id, v_member.id, v_code, 'pending', now() + v_validity
      )
      returning * into v_redemption;
      exit;
    exception
      when unique_violation then
        if v_attempts >= 10 then
          raise exception 'code_generation_failed';
        end if;
    end;
  end loop;

  return v_redemption;
end;
$$;

revoke all on function generate_redemption_code() from public;
grant execute on function generate_redemption_code() to authenticated;
