import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?erro=link_invalido", request.url));
  }

  const supabase = await createSupabaseServerClient();

  // Exchange the URL code for a session. Sets auth cookies on the response.
  const { data: exchange, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !exchange.session) {
    return NextResponse.redirect(
      new URL("/login?erro=link_expirado", request.url)
    );
  }

  const user = exchange.session.user;

  // Is there already a member row for this user?
  const { data: existingMember } = await supabase
    .from("members")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // First time landing here — look for invite metadata stashed at sign-up.
  const meta = (user.user_metadata ?? {}) as {
    invite_code?: string;
    name?: string;
    phone?: string | null;
  };

  if (!meta.invite_code || !meta.name) {
    // Orphan auth user without a member row and without an invite. Sign out
    // and bounce to login with a helpful message.
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
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/login?erro=${encodeURIComponent(consumeError.message)}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(new URL("/home", request.url));
}
