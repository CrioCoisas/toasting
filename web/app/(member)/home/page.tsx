import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/queries/member";
import { getActivePendingCode } from "@/lib/queries/redemption";
import { GenerateCodeButton } from "./generate-button";

export default async function HomePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const pending = await getActivePendingCode(member.id);
  if (pending) redirect("/codigo");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-xs uppercase tracking-wide text-muted">
        Olá, {member.name.split(" ")[0]}
      </p>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Você é membro <span className="font-medium text-foreground">{member.tier.name}</span>.
        Seu desconto é de{" "}
        <span className="font-medium text-foreground">
          {Number(member.tier.discount_percent)}%
        </span>{" "}
        e vale uma vez por dia em qualquer um dos nossos restaurantes.
      </p>

      <div className="my-10">
        <GenerateCodeButton />
      </div>

      <p className="max-w-xs text-xs text-muted">
        Toca pra gerar um código de 6 dígitos. Ele expira em 5 minutos — mostre
        ao garçom no momento de pedir.
      </p>
    </div>
  );
}
