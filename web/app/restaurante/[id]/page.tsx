"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { loadMember, type StoredMember } from "@/lib/auth-pin";

type Venue = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
};

type Redemption = {
  id: string;
  code: string;
  expires_at: string;
  applied_percent: number;
  venue_id: string;
};

const VENUE_PALETTE: Record<string, string> = {
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

export default function RestauranteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<StoredMember | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const m = loadMember();
    if (!m) {
      router.replace("/entrar");
      return;
    }
    setMember(m);
    fetch("/api/restaurantes")
      .then((r) => r.json())
      .then((data) => {
        const v = (data.venues ?? []).find((vv: Venue) => vv.id === id) ?? null;
        setVenue(v);
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const generate = async () => {
    if (!member || !venue) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/redemption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id, venueId: venue.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao gerar QR Code.");
      } else {
        setRedemption(data.redemption);
      }
    } catch {
      setError("Erro de conexão.");
    }
    setGenerating(false);
  };

  if (loading || !member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[1px] uppercase text-ink-mute">
          Carregando
        </p>
      </div>
    );
  }
  if (!venue) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-6 text-center">
        <p className="font-serif text-xl text-ink-mute">
          Casa não encontrada.
        </p>
        <Link href="/restaurantes" className="font-mono text-xs tracking-[1px] uppercase text-foreground underline">
          ← Voltar
        </Link>
      </div>
    );
  }

  const palette = VENUE_PALETTE[venue.slug] ?? "bg-card-7";
  const discount = Number(member.tier_discount_percent);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top */}
      <div className="px-7 pt-7">
        <button
          type="button"
          onClick={() => router.push("/restaurantes")}
          className="font-mono text-[10px] tracking-[2px] uppercase text-ink-mute"
        >
          ← Voltar
        </button>
      </div>

      {/* Hero slab — same palette as the card on the list */}
      <div className={`${palette} mx-7 mt-5 rounded-[24px] px-6 py-8`}>
        <p className="font-mono text-[9px] tracking-[2px] uppercase opacity-70">
          Casa
        </p>
        <h1 className="mt-1 font-serif text-[44px] leading-[1.05]">
          {venue.name}
        </h1>
        {venue.address && (
          <p className="mt-4 font-mono text-[10px] tracking-[1px] uppercase opacity-75">
            📍 {venue.address}
          </p>
        )}
        {venue.phone && (
          <p className="mt-1 font-mono text-[10px] tracking-[1px] uppercase opacity-75">
            ☎ {venue.phone}
          </p>
        )}
        <div className="mt-6 flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-[2px] uppercase opacity-80">
            Seu desconto
          </span>
          <span className="font-serif text-[64px] leading-none">
            −{discount}%
          </span>
        </div>
      </div>

      {/* QR card */}
      <div className="flex-1 px-7 pt-6 pb-10">
        {!redemption ? (
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="w-full rounded-full bg-foreground py-4 font-serif text-xl text-background transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {generating ? "Gerando..." : "Gerar QR Code"}
          </button>
        ) : (
          <div className="rounded-[24px] bg-paper px-6 py-8 ring-1 ring-line animate-fadeSlideUp">
            <p className="text-center font-mono text-[9px] tracking-[2px] uppercase text-ink-mute">
              Mostre ao garçom
            </p>
            <div className="mt-5 flex justify-center">
              <div className="rounded-2xl bg-background p-4 ring-1 ring-line">
                <QRCodeSVG
                  value={JSON.stringify({
                    code: redemption.code,
                    venue_id: redemption.venue_id,
                    expires_at: redemption.expires_at,
                    discount: redemption.applied_percent,
                  })}
                  size={200}
                  level="H"
                />
              </div>
            </div>
            <p className="mt-6 text-center font-serif text-3xl tracking-[6px] text-foreground">
              {redemption.code}
            </p>
            <p className="mt-3 text-center font-mono text-[10px] tracking-[1px] uppercase text-ink-mute">
              Válido por 2 horas · {venue.name}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-center font-mono text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <p className="mt-10 text-center font-display text-2xl text-ink-mute">
          Toasting
        </p>
      </div>
    </div>
  );
}
