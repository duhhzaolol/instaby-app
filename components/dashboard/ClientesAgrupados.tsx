"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ClienteCard, ClienteCardData, statusTone } from "@/components/dashboard/ClienteCard";
import { Badge } from "@/components/ui/Badge";

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
              <motion.span animate={{ rotate: aberto ? 0 : -90 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={15} className="text-muted" />
              </motion.span>
              <p className="text-sm font-medium text-text">{g.titulo}</p>
              <Badge tone={statusTone[g.chave] || "gray"}>{g.clientes.length}</Badge>
            </button>
            <AnimatePresence initial={false}>
              {aberto && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-3 pt-0.5 sm:grid-cols-2 lg:grid-cols-3">
                    {g.clientes.map((c, i) => (
                      <ClienteCard key={c.id} cliente={c} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
