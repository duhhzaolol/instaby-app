"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ClienteCard, ClienteCardData } from "@/components/dashboard/ClienteCard";

type Grupo = { chave: string; titulo: string; clientes: ClienteCardData[] };

export function ClientesAgrupados({ grupos }: { grupos: Grupo[] }) {
  const [fechados, setFechados] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-8">
      {grupos.map((g) => {
        if (g.clientes.length === 0) return null;
        const aberto = !fechados[g.chave];
        return (
          <div key={g.chave}>
            <button
              onClick={() => setFechados((prev) => ({ ...prev, [g.chave]: !prev[g.chave] }))}
              className="mb-3 flex w-full items-center gap-2 text-left"
            >
              <ChevronDown
                size={15}
                className={`text-muted transition-transform ${aberto ? "" : "-rotate-90"}`}
              />
              <p className="text-sm font-medium text-text">
                {g.titulo} <span className="text-muted">({g.clientes.length})</span>
              </p>
            </button>
            {aberto && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.clientes.map((c, i) => (
                  <ClienteCard key={c.id} cliente={c} index={i} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
