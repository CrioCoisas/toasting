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

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function RestaurantesPage() {
  const router = useRouter();
  const [member, setMember] = useState<StoredMember | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState("");
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

  const filtered = venues.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!member) return null;
  const firstName = member.name.split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <Link
          href="/perfil"
          className="avatar-gradient flex h-11 w-11 items-center justify-center rounded-full text-white font-mono text-sm font-bold shadow-md"
        >
          {initialsOf(member.name)}
        </Link>
        <button
          type="button"
          onClick={() => {
            clearMember();
            router.replace("/entrar");
          }}
          className="font-mono text-[11px] tracking-[1px] uppercase text-tertiary"
        >
          Sair
        </button>
      </div>

      {/* Greeting */}
      <div className="px-6 pb-6">
        <p className="text-[26px] leading-[1.1] text-tertiary">
          Olá, {firstName},
        </p>
        <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] text-black">
          Aonde vamos beber<br />ou comer hoje?
        </h1>
      </div>

      {/* Tier badge + search */}
      <div className="px-6 pb-4">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-light px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue" />
          <span className="font-mono text-[11px] tracking-[1px] uppercase text-blue">
            {member.tier_name} · {Number(member.tier_discount_percent)}% off
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-tertiary">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar restaurante..."
            className="w-full rounded-xl border border-border bg-[#f7f7f7] py-3.5 pl-11 pr-4 text-sm text-black outline-none transition-colors focus:border-blue"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-6 pb-24">
        {loading ? (
          <p className="py-12 text-center font-mono text-sm text-tertiary">
            Carregando...
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center font-mono text-sm text-tertiary">
            Nenhum restaurante encontrado.
          </p>
        ) : (
          filtered.map((v, i) => (
            <Link
              key={v.id}
              href={`/restaurante/${v.id}`}
              className="glass mb-3 block rounded-2xl p-4 transition-transform hover:-translate-y-0.5 animate-fadeSlideUp"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black font-mono text-sm font-bold text-white">
                  {initialsOf(v.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-base font-semibold text-black">
                      {v.name}
                    </h3>
                    <span className="shrink-0 rounded-full bg-blue px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      -{Number(member.tier_discount_percent)}%
                    </span>
                  </div>
                  {v.address && (
                    <p className="mt-0.5 truncate font-mono text-[11px] text-text-secondary">
                      📍 {v.address}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
