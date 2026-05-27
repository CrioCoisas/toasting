import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/queries/member";
import { getActivePendingCode } from "@/lib/queries/redemption";
import { CodeTimer } from "./code-timer";

export default async function CodigoPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const pending = await getActivePendingCode(member.id);
  if (!pending) redirect("/home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-wide text-muted">
        Seu código · {Number(member.tier.discount_percent)}%
      </p>

      <div className="mt-4 flex items-baseline gap-2 font-mono text-7xl font-semibold tracking-[0.15em] text-foreground tabular-nums sm:text-8xl">
        {pending.code.split("").map((digit, i) => (
          <span key={i}>{digit}</span>
        ))}
      </div>

      <p className="mt-6 font-medium text-foreground">{member.name}</p>
      <p className="text-xs text-muted">{member.tenant.name}</p>

      <div className="mt-8">
        <CodeTimer expiresAt={pending.expires_at} />
      </div>

      <p className="mt-10 max-w-xs text-xs text-muted">
        Mostre esse código ao garçom no momento de pedir. Ele só funciona uma
        vez e some quando o tempo acabar.
      </p>

      <Link
        href="/home"
        className="mt-6 text-xs font-medium text-muted underline hover:text-foreground"
      >
        Cancelar e voltar
      </Link>
    </div>
  );
}
