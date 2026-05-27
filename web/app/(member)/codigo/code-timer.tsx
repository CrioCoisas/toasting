"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CodeTimer({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  const isLow = remaining <= 30;

  return (
    <p
      className={`font-mono text-2xl tabular-nums ${
        isLow ? "text-danger" : "text-muted"
      }`}
    >
      {remaining > 0 ? format(remaining) : "Expirou"}
    </p>
  );
}
