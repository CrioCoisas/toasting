import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

// Route Handler pattern for Supabase SSR in Next.js 16:
// build the response first, then have the supabase client write its
// auth cookies onto that exact response object. This guarantees the
// session cookie survives the redirect.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description");
  const errorParam = url.searchParams.get("error");

  // Default redirect target — overridden below as we learn more.
  let redirectTo = new URL("/home", request.url);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (errorParam || errorDescription) {
    redirectTo = new URL(
      `/login?erro=${encodeURIComponent(errorDescription ?? errorParam ?? "link_invalido")}`,
      request.url
    );
    return NextResponse.redirect(redirectTo);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?erro=link_invalido", request.url));
  }

  const { data: exchange, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !exchange.session) {
    console.error("[auth/callback] exchange failed", exchangeError);
    return NextResponse.redirect(
      new URL("/login?erro=link_expirado", request.url)
    );
  }

  const user = exchange.session.user;

  // Check via RPC (bypasses RLS) — avoids policy edge cases on brand-new sessions.
  const { data: memberRows, error: memberCheckError } = (await (
    supabase.rpc as unknown as (name: string) => Promise<{
      data: Array<{ id: string }> | null;
      error: { message: string } | null;
    }>
  )("get_current_member"));

  if (memberCheckError) {
    console.error("[auth/callback] get_current_member failed", memberCheckError);
  }

  if (memberRows && memberRows.length > 0) {
    // Already a member — keep the response (with cookies) and go home.
    return response;
  }

  // First time: look for invite metadata stashed at signup.
  const meta = (user.user_metadata ?? {}) as {
    invite_code?: string;
    name?: string;
    phone?: string | null;
  };

  if (!meta.invite_code || !meta.name) {
    console.warn(
      "[auth/callback] missing invite metadata for user",
      user.id,
      user.email,
      meta
    );
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/login?erro=sem_convite", request.url)
    );
  }

  const { error: consumeError } = (await (
    supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>
    ) => Promise<{ error: { message: string } | null }>
  )("consume_invite", {
    p_code: meta.invite_code,
    p_name: meta.name,
    p_phone: meta.phone ?? null,
    p_photo_url: null,
  }));

  if (consumeError) {
    console.error("[auth/callback] consume_invite failed", consumeError);
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/login?erro=${encodeURIComponent(consumeError.message)}`,
        request.url
      )
    );
  }

  // Success — keep the response object (which has the auth cookies attached).
  return response;
}
