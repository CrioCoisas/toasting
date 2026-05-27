"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearMember, loadMember, type StoredMember } from "@/lib/auth-pin";

type Venue = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
};

// Editorial color tokens cycled by venue order (so adding a venue stays simple).
const CARD_PALETTE = [
  "bg-card-1", // red - Giancarlo
  "bg-card-2", // mustard - Quartinho
  "bg-card-3", // sage - Dainer
  "bg-card-4", // navy - Pope
  "bg-card-5", // terracotta pink - Chanchada
  "bg-card-6", // burnt orange - Guadalupe
  "bg-card-7", // charcoal - Café 18 do Forte
  "bg-card-8", // dusty purple - Deja Vu
  "bg-card-9", // sand - Fatchia
];

function paletteFor(slug: string, index: number): string {
  // Stable mapping by slug — fall back to index cycling.
  const fixed: Record<string, string> = {
    giancarlo: "bg-card-1",
    quartinho: "bg-card-2",
    dainer: "bg-card-3",
    pope: "bg-card-4",
    chanchada: "bg-card-5",
    guadalupe: "bg-card-6",
    "cafe-18-forte": "bg-card-7",
    "deja-vu": "bg-card-8",
    fatchia: "bg-card-9",
  };
  return fixed[slug] ?? CARD_PALETTE[index % CARD_PALETTE.length];
}

function neighborhoodOf(address: string | null): string {
  if (!address) return "";
  // Extract last comma-separated segment as a hint for now.
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export default function RestaurantesPage() {
  const router = useRouter();
  const [member, setMember] = useState<StoredMember | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const m = loadMember();
    if (!m) {
      router.replace("/entrar");
      return;
    }
    setMember(m);
    fetch("/api/restaurantes")
      .then((r) => r.json())
      .then((data) => setVenues(data.venues ?? []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [router]);

  if (!member) return null;
  const firstName = member.name.split(" ")[0];
  const discount = Number(member.tier_discount_percent);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-7 pt-7 pb-6">
        <Link
          href="/perfil"
          className="avatar-gradient h-12 w-12 rounded-full ring-1 ring-line"
          aria-label="Perfil"
        />
        <button
          type="button"
          onClick={() => {
            clearMember();
            router.replace("/entrar");
          }}
          className="font-mono text-[10px] tracking-[2px] uppercase text-ink-mute"
        >
          Sair
        </button>
      </div>

      {/* Editorial greeting */}
      <div className="px-7 pb-8">
        <p className="font-serif text-[28px] leading-none text-ink-mute">
          Olá, {firstName},
        </p>
        <h1 className="mt-3 font-serif text-[44px] leading-[1.05] text-foreground">
          Aonde vamos<br />beber ou comer<br />hoje?
        </h1>
        <div className="mt-5 inline-flex items-baseline gap-2">
          <span className="font-mono text-[10px] tracking-[2px] uppercase text-ink-mute">
            {member.tier_name}
          </span>
          <span className="font-mono text-[10px] text-ink-mute">·</span>
          <span className="font-serif text-base text-accent">
            {discount}% off
          </span>
        </div>
      </div>

      {/* Stacked colored cards */}
      <div className="flex-1 px-7 pb-10">
        {loading ? (
          <p className="py-8 text-center font-mono text-xs text-ink-mute tracking-[1px] uppercase">
            Carregando casas...
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {venues.map((v, i) => {
              const palette = paletteFor(v.slug, i);
              const neighborhood = neighborhoodOf(v.address);
              return (
                <Link
                  key={v.id}
                  href={`/restaurante/${v.id}`}
                  className={`${palette} group relative block rounded-[20px] px-5 py-5 transition-transform hover:-translate-y-1 animate-fadeSlideUp`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[9px] tracking-[2px] uppercase opacity-70">
                        Casa
                      </p>
                      <h3 className="mt-0.5 font-serif text-[26px] leading-tight">
                        {v.name}
                      </h3>
                      {neighborhood && (
                        <p className="mt-1 font-mono text-[10px] tracking-[1px] uppercase opacity-70">
                          {neighborhood}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-serif text-[36px] leading-none">
                        −{discount}%
                      </p>
                      <p className="mt-1 font-mono text-[9px] tracking-[1px] uppercase opacity-70">
                        off
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center font-display text-2xl text-ink-mute">
          Toasting
        </p>
      </div>
    </div>
  );
}
