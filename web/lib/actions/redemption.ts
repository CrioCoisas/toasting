"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: "Faz login primeiro.",
  member_not_found: "Perfil de membro não encontrado.",
  member_not_active: "Sua conta está pausada. Fala com o admin.",
  membership_expired: "Seu acesso expirou.",
  daily_limit_reached: "Você já usou seu desconto hoje. Volta amanhã 🍷",
  cooldown_active: "Acabou de usar — espera 5 minutos pra gerar outro.",
  code_generation_failed: "Não consegui gerar um código único, tenta de novo.",
};

export async function generateCode(
  _prev: ActionResult,
  _formData: FormData
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = (await (
    supabase.rpc as unknown as (
      name: string
    ) => Promise<{ error: { message: string } | null }>
  )("generate_redemption_code"));

  if (error) {
    return { error: ERROR_MESSAGES[error.message] ?? error.message };
  }

  revalidatePath("/home");
  revalidatePath("/codigo");
  redirect("/codigo");
}
