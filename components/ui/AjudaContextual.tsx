"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

/**
 * Ícone de ajuda contextual (? ) para usar ao lado de títulos de áreas do painel.
 * Ao clicar, abre um popover curto explicando pra que serve a área, como usar
 * e um exemplo rápido. Não é um tutorial longo — é só um empurrão de contexto.
 */
export function AjudaContextual({
  titulo,
  texto,
  exemplo,
}: {
  titulo: string;
  texto: string;
  exemplo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    if (aberto) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aberto]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-muted/70 transition-colors hover:text-accent"
        aria-label={`Ajuda sobre ${titulo}`}
      >
        <HelpCircle size={15} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-6 z-50 w-72 rounded-xl border border-border bg-card p-4 text-left shadow-premium">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-text">{titulo}</p>
            <button onClick={() => setAberto(false)} className="text-muted hover:text-text">
              <X size={14} />
            </button>
          </div>
          <p className="mb-2 text-xs leading-relaxed text-muted">{texto}</p>
          {exemplo && (
            <p className="rounded-lg bg-base/60 p-2 text-[11px] leading-relaxed text-muted">
              <span className="font-medium text-text/80">Exemplo: </span>
              {exemplo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
