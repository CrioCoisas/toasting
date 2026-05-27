import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Member, Tier, Tenant } from "@/lib/types/database";

export type MemberWithContext = Member & {
  tier: Pick<Tier, "id" | "name" | "discount_percent" | "max_uses_per_day" | "color">;
  tenant: Pick<Tenant, "id" | "name" | "slug">;
};

type RpcRow = {
  id: string;
  tenant_id: string;
  tier_id: string;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  status: "active" | "paused" | "revoked";
  joined_at: string;
  valid_until: string | null;
  tier_name: string;
  tier_discount_percent: number;
  tier_max_uses_per_day: number;
  tier_color: string | null;
  tenant_name: string;
  tenant_slug: string;
};

export async function getCurrentMember(): Promise<MemberWithContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // SECURITY DEFINER RPC avoids any RLS edge case with brand-new sessions.
  const { data } = (await (
    supabase.rpc as unknown as (name: string) => Promise<{
      data: RpcRow[] | null;
      error: unknown;
    }>
  )("get_current_member"));

  if (!data || data.length === 0) return null;
  const row = data[0];

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    tier_id: row.tier_id,
    auth_user_id: user.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    photo_url: row.photo_url,
    status: row.status,
    joined_at: row.joined_at,
    valid_until: row.valid_until,
    invited_by_admin_id: null,
    tier: {
      id: row.tier_id,
      name: row.tier_name,
      discount_percent: row.tier_discount_percent,
      max_uses_per_day: row.tier_max_uses_per_day,
      color: row.tier_color,
    },
    tenant: {
      id: row.tenant_id,
      name: row.tenant_name,
      slug: row.tenant_slug,
    },
  };
}
