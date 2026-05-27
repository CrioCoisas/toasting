"use client";

import { useActionState } from "react";
import { requestSignInLink, type ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    requestSignInLink,
    initialState
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-border bg-cream/30 p-5 text-center">
        <p className="font-display text-2xl text-foreground">Pronto!</p>
        <p className="mt-2 text-sm text-muted">
          Te mandamos um link no email. Abra e clique pra entrar no clube.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent"
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
        className="mt-2 h-11 rounded-full bg-accent text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Receber link de entrada"}
      </button>
    </form>
  );
}
