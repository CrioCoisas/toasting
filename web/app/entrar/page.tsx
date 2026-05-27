"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidPin, loadMember } from "@/lib/auth-pin";

const PIN_LENGTH = 10;

const KEYS_TOP = ["A", "M", "I", "G", "O", "S", "V", "P", "C", "H", "E", "F"];
const KEYS_NUMS = ["2", "0", "6"];

export default function EntrarPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadMember()) {
      router.replace("/restaurantes");
    }
  }, [router]);

  const appendChar = (c: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setPin((p) => p + c);
    setError(null);
  };

  const backspace = () => setPin((p) => p.slice(0, -1));

  const submit = () => {
    const normalized = pin.trim().toUpperCase();
    if (!normalized) {
      setError("Digite o código.");
      return;
    }
    if (!isValidPin(normalized)) {
      setError("Código inválido.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
      return;
    }
    setLoading(true);
    localStorage.setItem("toasting_pending_pin", normalized);
    router.push("/cadastro");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-7 pt-10 pb-8">
      <div className={`flex flex-1 flex-col ${shake ? "animate-shake" : ""}`}>
        <div className="mb-8">
          <p className="font-serif text-[28px] leading-none text-ink-mute">
            Bem-vindo,
          </p>
          <h1 className="mt-2 font-serif text-[44px] leading-[1.05] text-foreground">
            Insira seu código<br />de acesso.
          </h1>
        </div>

        <div className="mb-6 rounded-[20px] bg-paper px-5 py-5 ring-1 ring-line">
          <p className="font-mono text-[9px] tracking-[2px] uppercase text-ink-mute">
            Código
          </p>
          <p className="mt-1 font-serif text-[28px] tracking-[6px] text-foreground min-h-[34px]">
            {pin || "—"}
          </p>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`h-[3px] flex-1 rounded-full ${
                  i < pin.length ? "bg-accent" : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="mb-4 text-center font-mono text-[11px] tracking-[1px] text-danger min-h-[16px]">
          {error ?? " "}
        </p>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 gap-2">
            {KEYS_TOP.map((c) => (
              <KeyButton key={c} char={c} onClick={() => appendChar(c)} />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {KEYS_NUMS.map((c) => (
              <KeyButton key={c} char={c} onClick={() => appendChar(c)} mono />
            ))}
            <button
              type="button"
              onClick={backspace}
              className="rounded-2xl bg-cream-deep py-4 font-mono text-base text-foreground active:scale-95 ring-1 ring-line"
            >
              ←
            </button>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-3 rounded-full bg-foreground py-4 font-serif text-xl text-background transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <p className="mt-auto pt-8 text-center font-mono text-[10px] tracking-[1px] uppercase text-ink-mute">
          Solicite o código ao anfitrião do clube
        </p>
      </div>
    </div>
  );
}

function KeyButton({
  char,
  onClick,
  mono = false,
}: {
  char: string;
  onClick: () => void;
  mono?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl bg-paper py-4 text-foreground ring-1 ring-line active:scale-95 ${
        mono ? "font-mono text-lg" : "font-serif text-xl"
      }`}
    >
      {char}
    </button>
  );
}
