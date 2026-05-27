"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; ok?: boolean };

async function getOrigin(): Promise<string> {
  const h = await headers();
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function mapAuthError(raw: string): string {
  if (/after (\d+) seconds/i.test(raw)) {
    const seconds = raw.match(/after (\d+) seconds/i)?.[1] ?? "alguns";
    return `Aguarde ${seconds} segundos antes de pedir outro link.`;
  }
  if (/email rate limit/i.test(raw)) {
    return "Pedimos links demais pra esse email. Espera uns minutos.";
  }
  if (/invalid email/i.test(raw)) {
    return "Email inválido.";
  }
  return raw || "Erro ao enviar o link.";
}

// Magic link for existing members. Refuses to create a new user if the email
// isn't already in the system — pure login flow.
export async function requestSignInLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Digite seu email." };

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    // Supabase returns "Signups not allowed for otp" when shouldCreateUser is
    // false and the email isn't registered. Translate generically — we don't
    // want to leak which emails are members.
    if (/signups not allowed/i.test(error.message)) {
      return {
        error:
          "Não achei esse email no clube. Se foi convidado, use o link que recebeu.",
      };
    }
    return { error: mapAuthError(error.message) };
  }

  return { ok: true };
}

// Magic link for a new member coming through an invite. We stash the invite
// code + profile data in the user's metadata so /auth/callback can finalize
// the member row after the email is clicked.
export async function requestSignUpLink(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const code = String(formData.get("code") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!code || !email || !name) {
    return { error: "Preencha nome e email." };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name,
        phone,
        invite_code: code,
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
