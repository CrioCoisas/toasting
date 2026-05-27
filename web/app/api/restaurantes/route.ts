import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PILOT_TENANT_SLUG = "grupo-piloto";

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, slug, address, phone, logo_url, active, tenant_id, tenants!inner(slug)")
    .eq("tenants.slug", PILOT_TENANT_SLUG)
    .eq("active", true)
    .order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ venues: data ?? [] });
}
