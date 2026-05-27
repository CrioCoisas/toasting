// Simple PIN-based access for the MVP. Each PIN maps to a Toasting tier in
// the pilot tenant. No email, no Supabase Auth — the client stores the
// member identity in localStorage after a server roundtrip that creates/
// fetches the member record.

export const PIN_CODES: Record<string, { tierSlug: string; label: string }> = {
  AMIGOS2026: { tierSlug: "amigos", label: "Amigo" },
  VIP2026: { tierSlug: "amigos", label: "VIP" },
  CHEF2026: { tierSlug: "amigos", label: "Chef" },
};

export function isValidPin(input: string): boolean {
  return PIN_CODES[input.trim().toUpperCase()] !== undefined;
}

export type StoredMember = {
  id: string;
  name: string;
  email: string;
  tier_slug: string;
  tier_name: string;
  tier_discount_percent: number;
  tenant_slug: string;
  tenant_name: string;
  pin_label: string;
};

export const STORAGE_KEY = "toasting_member";

export function loadMember(): StoredMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredMember;
  } catch {
    return null;
  }
}

export function saveMember(m: StoredMember): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
}

export function clearMember(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("toasting_pending_pin");
}
