"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/auth";

// Temporary code-based login. Each known member has a fixed email + a
// short passphrase that maps to their Supabase auth password. This unblocks
// testing while the magic-link flow is being stabilized.
const CODE_TO_ACCOUNT: Record<string, { email: string; password: string }> = {
  "AMIGOS-2026": {
    email: "eusouamandamarques@gmail.com",
    password: "AMIGOS-2026",
  },
};

export async function signInWithCode(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const codigo = String(formData.get("codigo") ?? "")
    .trim()
    .toUpperCase();

  if (!codigo) return { error: "Digite o código." };

  const account = CODE_TO_ACCOUNT[codigo];
  if (!account) return { error: "Código inválido." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(account);

  if (error) {
    return { error: "Não consegui entrar. Tenta de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}
