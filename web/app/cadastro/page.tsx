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
    <div className="flex min-h-screen flex-col bg-white px-6 pt-12 pb-8">
      <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col">
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl text-black">Toasting</h1>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-blue" />
          <p className="mt-4 font-mono text-xs tracking-[2px] text-tertiary uppercase">
            Complete seu cadastro
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="glass rounded-xl p-4 backdrop-blur-[20px]">
            <span className="block font-mono text-[10px] tracking-[1px] uppercase text-tertiary mb-1">
              Seu nome
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amanda Marques"
              autoComplete="name"
              className="w-full bg-transparent text-base text-black outline-none placeholder-[#bfbfbf]"
            />
          </label>
          <label className="glass rounded-xl p-4 backdrop-blur-[20px]">
            <span className="block font-mono text-[10px] tracking-[1px] uppercase text-tertiary mb-1">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              className="w-full bg-transparent text-base text-black outline-none placeholder-[#bfbfbf]"
            />
          </label>

          {error && (
            <p className="text-center font-mono text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-black py-4 font-mono text-sm font-bold tracking-[1px] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Continuar"}
          </button>
          <button
            type="button"
            onClick={() => router.replace("/entrar")}
            className="rounded-xl border border-border bg-[#f7f7f7] py-3 text-sm text-black"
          >
            ← Voltar
          </button>
        </form>
      </div>
    </div>
  );
}
