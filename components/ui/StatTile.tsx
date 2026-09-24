"use client";

import { motion } from "framer-motion";

// Cartão de estatística reutilizável — mesmo contrato visual criado pro Tráfego Pago
// (ícone colorido + rótulo em caixa alta + valor grande + sub-legenda opcional),
// agora compartilhado por qualquer tela que precise do mesmo estilo de "número em
// destaque" (Clientes, Visão Geral do cliente, etc.) em vez de reimplementar em cada uma.
export function StatTile({
  Icon,
  cor,
  label,
  valor,
  sub,
  index = 0,
}: {
  Icon: any;
  cor: string;
  label: string;
  valor: React.ReactNode;
  sub?: React.ReactNode;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-xl border border-border bg-card/60 p-3.5"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={12} style={{ color: cor }} />
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="text-lg font-semibold text-text">{valor}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </motion.div>
  );
}
