import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CodeLoginForm } from "./code-login-form";

export default async function EntrarPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <h1 className="font-display text-5xl text-foreground">Toasting</h1>
        </Link>
        <p className="mt-2 mb-8 text-center text-sm text-muted">
          Digite seu código de acesso.
        </p>
        <CodeLoginForm />
      </div>
    </div>
  );
}
