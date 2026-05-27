import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PIN_CODES } from "@/lib/auth-pin";
import type { StoredMember } from "@/lib/auth-pin";

const PILOT_TENANT_SLUG = "grupo-piloto";

export async function POST(request: NextRequest) {
  let body: { pin?: string; name?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const pin = (body.pin ?? "").trim().toUpperCase();
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();

  const pinInfo = PIN_CODES[pin];
  if (!pinInfo) {
    return NextResponse.json({ error: "invalid_pin" }, { status: 401 });
  }
  if (!name || !email) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Look up tenant + tier.
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", PILOT_TENANT_SLUG)
    .maybeSingle();
  if (tenantError || !tenant) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 500 });
  }

  const { data: tier, error: tierError } = await supabase
    .from("tiers")
    .select("id, name, slug, discount_percent")
    .eq("tenant_id", tenant.id)
    .eq("slug", pinInfo.tierSlug)
    .maybeSingle();
  if (tierError || !tier) {
    return NextResponse.json({ error: "tier_not_found" }, { status: 500 });
  }

  // Find existing member or create.
  const { data: existing } = await supabase
    .from("members")
    .select("id, name, email, tier_id, tenant_id")
    .eq("tenant_id", tenant.id)
    .eq("email", email)
    .maybeSingle();

  let memberId: string;
  if (existing) {
    memberId = existing.id;
    // Refresh tier in case the PIN moves them to a different one.
    if (existing.tier_id !== tier.id) {
      await supabase
        .from("members")
        .update({ tier_id: tier.id, name })
        .eq("id", existing.id);
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("members")
      .insert({
        tenant_id: tenant.id,
        tier_id: tier.id,
        email,
        name,
        status: "active",
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      return NextResponse.json({ error: "create_failed" }, { status: 500 });
    }
    memberId = inserted.id;
  }

  const stored: StoredMember = {
    id: memberId,
    name,
    email,
    tier_slug: tier.slug,
    tier_name: tier.name,
    tier_discount_percent: Number(tier.discount_percent),
    tenant_slug: tenant.slug,
    tenant_name: tenant.name,
    pin_label: pinInfo.label,
  };

  return NextResponse.json({ member: stored });
}
