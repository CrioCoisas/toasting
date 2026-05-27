import { NextResponse, type NextRequest } from "next/server";

// Pass-through proxy: PIN-based auth is handled entirely client-side via
// localStorage. Pages themselves redirect to /entrar when the member isn't
// loaded. No Supabase session needs to be tracked at the edge anymore.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
