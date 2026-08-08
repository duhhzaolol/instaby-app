"use client";

import { useEffect, useState } from "react";

const NUMEROS = ["128", "947", "2.3K", "8.1K", "24K", "76K", "210K"];

export function ShutterLoading() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % NUMEROS.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-[#09090B]">
      <div className="relative h-16 w-60 overflow-visible">
        {/* flash sutil no instante do fechamento */}
        <div className="pointer-events-none absolute -inset-8 animate-shutter-flash rounded-full bg-white blur-2xl" />

        {/* número que aparece no vão do obturador */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            key={i}
            className="animate-shutter-number font-mono text-2xl font-bold tabular-nums text-[#E63946]"
          >
            +{NUMEROS[i]}
          </span>
        </div>

        {/* metade esquerda — INSTA */}
        <div className="absolute inset-y-0 left-0 flex w-1/2 animate-shutter-left items-center justify-end overflow-hidden bg-black pr-2">
          <span className="text-2xl font-black italic tracking-tight text-white">INSTA</span>
        </div>

        {/* metade direita — BY */}
        <div className="absolute inset-y-0 right-0 flex w-1/2 animate-shutter-right items-center justify-start overflow-hidden bg-[#F1F1F1] pl-2">
          <span className="text-2xl font-black italic tracking-tight text-black">BY</span>
        </div>
      </div>

      <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B7280]">carregando</p>
    </div>
  );
}
