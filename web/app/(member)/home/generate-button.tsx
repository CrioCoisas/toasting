"use client";

import { useActionState } from "react";
import { generateCode } from "@/lib/actions/redemption";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = {};

export function GenerateCodeButton() {
  const [state, formAction, isPending] = useActionState(
    generateCode,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <button
        type="submit"
        disabled={isPending}
        className="flex h-44 w-44 items-center justify-center rounded-full bg-accent text-center text-base font-medium leading-snug text-cream shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Gerando..." : (
          <span>
            Gerar<br />código
          </span>
        )}
      </button>
      {state.error && (
        <p className="max-w-xs text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
