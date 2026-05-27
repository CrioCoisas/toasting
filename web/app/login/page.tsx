import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  link_invalido: "O link que você usou é inválido.",
  link_expirado: "O link expirou. Pede outro abaixo.",
  sem_convite: "Sua conta ainda não está vinculada ao clube. Pede um convite.",
  invite_not_found: "Esse convite não existe mais.",
  invite_exhausted: "Esse convite já foi usado.",
  invite_expired: "Esse convite expirou.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/home");

  const { erro } = await searchParams;
  const errorMessage = erro
    ? ERROR_MESSAGES[erro] ?? decodeURIComponent(erro)
    : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <h1 className="font-display text-5xl text-foreground">Toasting</h1>
        </Link>
        <p className="mt-2 mb-8 text-center text-sm text-muted">
          Entrar é simples — só mandamos um link no seu email.
        </p>
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            {errorMessage}
          </div>
        )}
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted">
          Foi convidado?{" "}
          <span className="text-foreground">
            Abra o link que você recebeu.
          </span>
        </p>
      </div>
    </div>
  );
}
