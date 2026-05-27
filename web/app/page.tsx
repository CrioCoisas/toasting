import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="font-display text-7xl text-foreground sm:text-8xl">
          Toasting
        </h1>
        <p className="max-w-md text-base text-muted leading-relaxed">
          Clube de benefícios da casa. Um lugar pra brindar com quem importa,
          nos restaurantes que importam.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-cream transition-opacity hover:opacity-90"
          >
            Entrar
          </Link>
          <Link
            href="/sobre"
            className="flex h-12 items-center justify-center rounded-full border border-border bg-surface px-8 text-sm font-medium text-foreground transition-colors hover:bg-cream/30"
          >
            Sobre o clube
          </Link>
        </div>
      </div>
    </div>
  );
}
