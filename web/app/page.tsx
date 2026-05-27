"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const member =
      typeof window !== "undefined" ? localStorage.getItem("toasting_member") : null;
    const t = setTimeout(() => {
      router.replace(member ? "/restaurantes" : "/entrar");
    }, 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-700 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <h1 className="font-display text-[88px] leading-none text-foreground">
          Toasting
        </h1>
        <p className="font-mono text-[10px] tracking-[4px] text-ink-mute uppercase">
          Clube de Benefícios
        </p>
      </div>
    </div>
  );
}
