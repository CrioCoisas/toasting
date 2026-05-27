import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Redemption } from "@/lib/types/database";

export async function getActivePendingCode(
  memberId: string
): Promise<Redemption | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("redemptions")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getLastUsedRedemption(
  memberId: string
): Promise<Redemption | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("redemptions")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "used")
    .order("redeemed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
