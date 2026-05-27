import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase env vars are missing (e.g. first-time setup), skip auth gracefully.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser.
  // Refreshing the session via getUser ensures Server Components get fresh data.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isPublic =
    url.pathname === "/" ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/convite") ||
    url.pathname.startsWith("/sobre") ||
    url.pathname.startsWith("/garcom/login") ||
    url.pathname.startsWith("/admin/login") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api/public");

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    if (url.pathname.startsWith("/admin")) {
      loginUrl.pathname = "/admin/login";
    } else if (url.pathname.startsWith("/garcom")) {
      loginUrl.pathname = "/garcom/login";
    } else {
      loginUrl.pathname = "/login";
    }
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
