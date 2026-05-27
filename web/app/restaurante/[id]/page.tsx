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

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="font-mono text-sm text-tertiary">Carregando...</p>
      </div>
    );
  }
  if (!venue) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white gap-4 px-6 text-center">
        <p className="font-mono text-sm text-tertiary">
          Restaurante não encontrado.
        </p>
        <Link href="/restaurantes" className="font-mono text-sm text-blue">
          ← Voltar
        </Link>
      </div>
    );
  }

  const discount = Number(member.tier_discount_percent);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="px-6 pt-8">
        <button
          type="button"
          onClick={() => router.push("/restaurantes")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-[#f7f7f7] px-3 py-2 font-mono text-xs text-black"
        >
          ← Voltar
        </button>
      </div>

      <div className="px-6 pt-6 pb-4 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-black font-mono text-2xl font-bold text-white">
          {initialsOf(venue.name)}
        </div>
        <h1 className="text-[28px] font-semibold leading-tight text-black">
          {venue.name}
        </h1>
        {venue.address && (
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[1px] text-blue">
            📍 {venue.address}
          </p>
        )}
      </div>

      <div className="px-6 pb-8">
        {/* Discount badge */}
        <div className="rounded-2xl bg-blue p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-white">
            Seu desconto
          </p>
          <p className="mt-1 text-5xl font-bold text-white">{discount}%</p>
          <p className="font-mono text-[11px] text-white/85">em toda a conta</p>
        </div>

        {/* QR */}
        {!redemption ? (
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="mt-6 w-full rounded-[14px] bg-black py-[18px] font-mono text-sm font-bold tracking-[1px] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {generating ? "Gerando..." : "Gerar QR Code"}
          </button>
        ) : (
          <div className="glass mt-6 rounded-[20px] p-6 text-center animate-fadeSlideUp">
            <p className="font-mono text-[11px] uppercase tracking-[2px] font-semibold text-blue">
              Mostre ao garçom
            </p>
            <div className="mt-5 inline-block rounded-2xl bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
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
            <p className="mt-5 inline-block rounded-lg bg-[#f7f7f7] px-4 py-2.5 font-mono text-sm tracking-[4px] text-black">
              {redemption.code}
            </p>
            <p className="mt-3 font-mono text-[11px] text-tertiary">
              Válido por 2 horas. Uso único no {venue.name}.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-center font-mono text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <p className="mt-8 text-center font-mono text-[10px] tracking-[1px] uppercase text-tertiary">
          Toasting · {member.name}
        </p>
      </div>
    </div>
  );
}
