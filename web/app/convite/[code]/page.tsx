import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";
import type { InvitePreview } from "@/lib/types/database";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = (await (
    supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>
    ) => Promise<{ data: InvitePreview[] | null; error: unknown }>
  )("preview_invite", { p_code: code }));
  const preview: InvitePreview | null =
    !error && data && data.length > 0 ? data[0] : null;

  if (!preview) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-5xl text-foreground">Toasting</h1>
        <p className="mt-6 max-w-sm text-sm text-muted">
          Esse convite não está mais válido. Pede um novo pra quem te indicou.
        </p>
        <Link
          href="/"
          className="mt-6 text-sm font-medium text-accent underline"
        >
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center">
          <h1 className="font-display text-5xl text-foreground">Toasting</h1>
        </Link>
        <div className="mt-6 mb-6 rounded-xl border border-border bg-cream/30 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">
            Você foi convidado
          </p>
          <p className="mt-1 text-sm text-foreground">
            <span className="font-medium">{preview.tier_name}</span> ·{" "}
            {Number(preview.discount_percent)}% no {preview.tenant_name}
          </p>
        </div>
        <SignupForm code={code} />
      </div>
    </div>
  );
}
