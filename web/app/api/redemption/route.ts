import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function generate6DigitCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}

const VALIDITY_MIN = 120; // 2h, igual V1

export async function POST(request: NextRequest) {
  let body: { memberId?: string; venueId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const memberId = (body.memberId ?? "").trim();
  const venueId = (body.venueId ?? "").trim();
  if (!memberId || !venueId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Fetch member + tier (need tenant + discount).
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, tenant_id, status, tier_id, tiers!inner(discount_percent, max_uses_per_day)")
    .eq("id", memberId)
    .maybeSingle();
  if (memberError || !member) {
    return NextResponse.json({ error: "member_not_found" }, { status: 404 });
  }
  if (member.status !== "active") {
    return NextResponse.json({ error: "member_inactive" }, { status: 403 });
  }

  // Verify venue belongs to the same tenant.
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, tenant_id")
    .eq("id", venueId)
    .maybeSingle();
  if (!venue || venue.tenant_id !== member.tenant_id) {
    return NextResponse.json({ error: "venue_invalid" }, { status: 400 });
  }

  // Try to insert a new pending redemption with a unique code (retry on collision).
  const expiresAt = new Date(Date.now() + VALIDITY_MIN * 60_000).toISOString();
  // tiers is returned as an array because of the !inner join; the row itself
  // is a one-to-many shape in Supabase typings.
  const tierRow = Array.isArray(member.tiers)
    ? member.tiers[0]
    : (member.tiers as { discount_percent: number } | null);
  const discount = Number(tierRow?.discount_percent ?? 0);

  for (let i = 0; i < 8; i++) {
    const code = generate6DigitCode();
    const { data: inserted, error: insertError } = await supabase
      .from("redemptions")
      .insert({
        tenant_id: member.tenant_id,
        member_id: member.id,
        venue_id: venue.id,
        code,
        status: "pending",
        expires_at: expiresAt,
        applied_percent: discount,
      })
      .select("id, code, expires_at, applied_percent, venue_id")
      .single();
    if (!insertError && inserted) {
      return NextResponse.json({
        redemption: inserted,
        venueName: venue.name,
      });
    }
    if (insertError && !/unique/i.test(insertError.message)) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "code_generation_failed" }, { status: 500 });
}
