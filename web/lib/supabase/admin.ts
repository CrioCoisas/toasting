import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only admin client using the service role key. Bypasses RLS — only
// use inside trusted server routes / actions, never expose to the browser.
// We intentionally drop the Database generic here: the typed shape of joined
// queries with !inner doesn't survive Supabase's type inference, and runtime
// safety comes from API route validation, not compile-time generics.
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
