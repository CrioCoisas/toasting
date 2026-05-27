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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-8">
      <div
        className={`flex flex-col items-center gap-3 transition-opacity duration-700 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="font-display text-7xl text-black">Toasting</h1>
        <div className="h-1 w-12 rounded-full bg-blue" />
        <p className="font-mono text-xs tracking-[3px] text-tertiary uppercase">
          Clube de Benefícios
        </p>
      </div>
    </div>
  );
}
