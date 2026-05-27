import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Member, Tier, Tenant } from "@/lib/types/database";

export type MemberWithContext = Member & {
  tier: Pick<Tier, "id" | "name" | "discount_percent" | "max_uses_per_day" | "color">;
  tenant: Pick<Tenant, "id" | "name" | "slug">;
};

export async function getCurrentMember(): Promise<MemberWithContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select(
      `*,
       tier:tiers(id, name, discount_percent, max_uses_per_day, color),
       tenant:tenants(id, name, slug)`
    )
    .eq("auth_user_id", user.id)
    .single();

  return (data as unknown as MemberWithContext) ?? null;
}
