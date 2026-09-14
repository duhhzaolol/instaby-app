"use client";

import Link from "next/link";
import { useOcultarValores, ValorSensivel } from "@/components/ui/OcultarValores";
import { formatarTempoRenovacao } from "@/lib/formatarTempoRenovacao";

export function MensalidadeChip({
  clienteId,
  mensalidade,
  diasParaRenovar,
}: {
  clienteId: string;
  mensalidade: number;
  diasParaRenovar: number | null;
}) {
  const { oculto } = useOcultarValores();

  if (mensalidade <= 0) return null;

  return (
    <Link
      href={`/dashboard/clientes/${clienteId}?aba=servicos`}
      className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-1.5 text-right transition-colors hover:bg-accent/10"
    >
      <p className="text-[10px] text-muted">Mensalidade · editar em Serviços</p>
      <p className="text-sm font-medium text-accent">
        <ValorSensivel oculto={oculto}>R$ {mensalidade.toFixed(0)}</ValorSensivel>
      </p>
      {diasParaRenovar !== null && (
        <p className="text-[10px] text-muted">renova em {formatarTempoRenovacao(diasParaRenovar)}</p>
      )}
    </Link>
  );
}
