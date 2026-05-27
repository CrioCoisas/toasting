"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMember } from "@/lib/auth-pin";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pending = localStorage.getItem("toasting_pending_pin");
    if (!pending) {
      router.replace("/entrar");
      return;
    }
    setPin(pending);
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    if (!name.trim() || !email.trim()) {
      setError("Preencha nome e email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_pin"
            ? "Código inválido."
            : data.error === "invalid_email"
            ? "Email inválido."
            : "Não consegui criar seu acesso. Tenta de novo."
        );
        setLoading(false);
        return;
      }
      saveMember(data.member);
      localStorage.removeItem("toasting_pending_pin");
      router.replace("/restaurantes");
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-7 pt-10 pb-8">
      <div className="flex flex-1 flex-col">
        <div className="mb-8">
          <p className="font-serif text-[28px] leading-none text-ink-mute">
            Quase lá,
          </p>
          <h1 className="mt-2 font-serif text-[44px] leading-[1.05] text-foreground">
            Como você<br />se chama?
          </h1>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="rounded-[20px] bg-paper px-5 py-5 ring-1 ring-line">
            <label className="block">
              <span className="font-mono text-[9px] tracking-[2px] uppercase text-ink-mute">
                Nome completo
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amanda Marques"
                autoComplete="name"
                className="mt-1 w-full bg-transparent font-serif text-2xl text-foreground outline-none placeholder-[#b8afa0]"
              />
            </label>
          </div>
          <div className="rounded-[20px] bg-paper px-5 py-5 ring-1 ring-line">
            <label className="block">
              <span className="font-mono text-[9px] tracking-[2px] uppercase text-ink-mute">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                className="mt-1 w-full bg-transparent font-serif text-2xl text-foreground outline-none placeholder-[#b8afa0]"
              />
            </label>
          </div>

          {error && (
            <p className="text-center font-mono text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-3 rounded-full bg-foreground py-4 font-serif text-xl text-background transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Continuar"}
          </button>
          <button
            type="button"
            onClick={() => router.replace("/entrar")}
            className="font-mono text-[10px] tracking-[1px] uppercase text-ink-mute"
          >
            ← Voltar
          </button>
        </form>
      </div>
    </div>
  );
}
