"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { visualDaRede } from "@/lib/redesSociais";

export type RelatorioResumo = {
  id: string;
  rede: string;
  inicio: string;
  fim: string;
  seguidoresInicio: number | null;
  seguidoresFim: number | null;
  investimento: number | null;
  leads: number | null;
};

export function RelatorioCard({ relatorio, index }: { relatorio: RelatorioResumo; index: number }) {
  const router = useRouter();
  const { icone: Icon, cor, label } = visualDaRede(relatorio.rede);

  const crescimento =
    relatorio.seguidoresInicio && relatorio.seguidoresFim
      ? relatorio.seguidoresFim - relatorio.seguidoresInicio
      : null;
  const crescimentoPct =
    crescimento !== null && relatorio.seguidoresInicio
      ? Math.round((crescimento / relatorio.seguidoresInicio) * 1000) / 10
      : null;

  async function excluir() {
    if (!confirm("Excluir esse relatório?")) return;
    await fetch(`/api/relatorios/${relatorio.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card index={index} hoverable={false} className="flex items-center justify-between px-4 py-3">
      <Link href={`/relatorio/${relatorio.id}`} target="_blank" className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${cor}1A`, color: cor }}
        >
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-text">
            {label} · {new Date(relatorio.inicio).toLocaleDateString("pt-BR")} a{" "}
            {new Date(relatorio.fim).toLocaleDateString("pt-BR")}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted">
            {crescimento !== null ? (
              <>
                {crescimento >= 0 ? (
                  <TrendingUp size={11} className="text-emerald-400" />
                ) : (
                  <TrendingDown size={11} className="text-red-400" />
                )}
                {crescimento >= 0 ? "+" : ""}
                {crescimento} seguidores ({crescimentoPct}%)
              </>
            ) : relatorio.investimento ? (
              `R$ ${relatorio.investimento.toFixed(0)} investidos · ${relatorio.leads || 0} leads`
            ) : (
              "Ver relatório"
            )}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Link href={`/relatorio/${relatorio.id}`} target="_blank" className="text-muted hover:text-text">
          <ExternalLink size={13} />
        </Link>
        <button onClick={excluir} className="text-muted hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );
}
