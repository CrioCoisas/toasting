"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidPin, loadMember } from "@/lib/auth-pin";

const PIN_LENGTH = 10;

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
      setError("Código inválido. Pede pro anfitrião.");
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
    <div className="flex min-h-screen flex-col bg-white px-6 pt-12 pb-8">
      <div
        className={`mx-auto flex w-full max-w-[360px] flex-1 flex-col ${
          shake ? "animate-shake" : ""
        }`}
      >
        <div className="mb-10 text-center">
          <h1 className="font-display text-5xl text-black">Toasting</h1>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-blue" />
          <p className="mt-4 font-mono text-xs tracking-[2px] text-tertiary uppercase">
            Insira seu código de acesso
          </p>
        </div>

        <div className="mb-2 flex justify-center gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full transition-colors ${
                i < pin.length ? "bg-blue" : "bg-[#e8e8e8]"
              }`}
            />
          ))}
        </div>
        <p className="mb-1 text-center font-mono text-base tracking-[4px] text-black h-6">
          {pin || " "}
        </p>
        <p className="mb-6 text-center text-sm text-danger h-5" role="alert">
          {error ?? " "}
        </p>

        <Numpad
          onDigit={appendChar}
          onBackspace={backspace}
          onSubmit={submit}
          submitting={loading}
        />

        <p className="mt-6 text-center font-mono text-[11px] tracking-[1px] text-tertiary">
          Solicite o código ao anfitrião do clube.
        </p>
      </div>
    </div>
  );
}

function Numpad({
  onDigit,
  onBackspace,
  onSubmit,
  submitting,
}: {
  onDigit: (c: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const rows: string[][] = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];
  const letters: string[] = ["A", "I", "M", "O", "G", "S", "V", "P", "C", "H", "E", "F"];
  const [mode, setMode] = useState<"digits" | "letters">("letters");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode("letters")}
          className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-[11px] tracking-[1px] transition-colors ${
            mode === "letters"
              ? "border-blue bg-blue-light text-blue"
              : "border-border bg-[#f7f7f7] text-text-secondary"
          }`}
        >
          ABC
        </button>
        <button
          type="button"
          onClick={() => setMode("digits")}
          className={`flex-1 rounded-lg border px-2 py-1.5 font-mono text-[11px] tracking-[1px] transition-colors ${
            mode === "digits"
              ? "border-blue bg-blue-light text-blue"
              : "border-border bg-[#f7f7f7] text-text-secondary"
          }`}
        >
          123
        </button>
      </div>

      {mode === "digits" ? (
        <div className="grid grid-cols-3 gap-2">
          {rows.flat().map((d) => (
            <NumpadKey key={d} char={d} onClick={() => onDigit(d)} />
          ))}
          <button
            type="button"
            onClick={onBackspace}
            className="rounded-xl border border-border bg-[#f7f7f7] py-4 font-mono text-base text-black active:scale-95"
          >
            ←
          </button>
          <NumpadKey char="0" onClick={() => onDigit("0")} />
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl border border-transparent bg-black py-4 font-mono text-base font-bold text-white active:scale-95 disabled:opacity-60"
          >
            ✓
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {letters.map((l) => (
            <NumpadKey key={l} char={l} onClick={() => onDigit(l)} small />
          ))}
          <button
            type="button"
            onClick={onBackspace}
            className="col-span-2 rounded-xl border border-border bg-[#f7f7f7] py-3.5 font-mono text-sm text-black active:scale-95"
          >
            ← Apagar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="col-span-2 rounded-xl border border-transparent bg-black py-3.5 font-mono text-sm font-bold text-white active:scale-95 disabled:opacity-60"
          >
            {submitting ? "..." : "Entrar"}
          </button>
        </div>
      )}
    </div>
  );
}

function NumpadKey({
  char,
  onClick,
  small = false,
}: {
  char: string;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border border-border bg-[#f7f7f7] font-mono text-black active:scale-95 ${
        small ? "py-3 text-sm" : "py-4 text-lg font-bold"
      }`}
    >
      {char}
    </button>
  );
}
