"use client";

import { useActionState } from "react";
import { signInWithCode } from "@/lib/actions/code-login";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = {};

export function CodeLoginForm() {
  const [state, formAction, isPending] = useActionState(
    signInWithCode,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Código de acesso</span>
        <input
          name="codigo"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          placeholder="ex: AMIGOS-2026"
          className="h-12 rounded-lg border border-border bg-surface px-3 text-center text-lg font-mono uppercase tracking-widest text-foreground outline-none focus:border-accent"
        />
      </label>
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 h-12 rounded-full bg-accent text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
