"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REDES } from "@/lib/redesSociais";

export function RedesGerenciadasForm({ clienteId, redesAtuais }: { clienteId: string; redesAtuais: string[] }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState<string | null>(null);

  async function alternar(rede: string) {
    setSalvando(rede);
    const novaLista = redesAtuais.includes(rede)
      ? redesAtuais.filter((r) => r !== rede)
      : [...redesAtuais, rede];

    await fetch(`/api/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redesGerenciadas: novaLista }),
    });

    setSalvando(null);
    router.refresh();
  }

  return (
    <div className="mb-5">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Redes que a Instaby gerencia</p>
      <div className="flex flex-wrap gap-2">
        {REDES.map((r) => {
          const Icon = r.icone;
          const ativa = redesAtuais.includes(r.valor);
          return (
            <button
              key={r.valor}
              onClick={() => alternar(r.valor)}
              disabled={salvando === r.valor}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                ativa
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border bg-card/40 text-muted hover:text-text"
              }`}
            >
              <Icon size={12} /> {r.label} {ativa && "✓"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
