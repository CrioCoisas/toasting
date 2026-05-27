import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/queries/member";
import { signOut } from "@/lib/actions/auth";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface/60 px-5 py-3 backdrop-blur">
        <Link href="/home">
          <span className="font-display text-2xl text-foreground">Toasting</span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs font-medium text-muted hover:text-foreground"
          >
            Sair
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
