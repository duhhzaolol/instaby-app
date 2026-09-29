"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";

// Mesmo padrão já usado em BotaoImprimirResumo.tsx (Financeiro) e BotaoBaixarPdf
// (RelatorioInterativo.tsx) — não existe biblioteca de geração de PDF no projeto,
// então "Baixar PDF" é sempre imprimir/salvar como PDF pelo navegador.
export function BotaoImprimirRelatorioTrafego({ voltarHref }: { voltarHref: string }) {
  return (
    <div className="mb-6 flex items-center justify-between print:hidden">
      <Link href={voltarHref} className="flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Voltar
      </Link>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Printer size={14} /> Baixar PDF
      </button>
    </div>
  );
}
