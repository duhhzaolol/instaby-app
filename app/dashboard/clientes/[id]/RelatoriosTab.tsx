import { RedesGerenciadasForm } from "@/components/dashboard/RedesGerenciadasForm";
import { NovoRelatorioForm } from "@/components/dashboard/NovoRelatorioForm";
import { RelatorioCard, RelatorioResumo } from "@/components/dashboard/RelatorioCard";
import { HistoricoRelatorios } from "@/components/dashboard/HistoricoRelatorios";
import { BarChart3 } from "lucide-react";

export default function RelatoriosTab({
  clienteId,
  redesGerenciadas,
  relatorios,
}: {
  clienteId: string;
  redesGerenciadas: string[];
  relatorios: RelatorioResumo[];
}) {
  return (
    <div>
      <RedesGerenciadasForm clienteId={clienteId} redesAtuais={redesGerenciadas} />

      {redesGerenciadas.length === 0 ? (
        <p className="text-sm text-muted">
          Marque acima quais redes a Instaby gerencia pra esse cliente, pra poder lançar relatórios.
        </p>
      ) : (
        <>
          <NovoRelatorioForm clienteId={clienteId} redesGerenciadas={redesGerenciadas} />

          <HistoricoRelatorios relatorios={relatorios} />

          {relatorios.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 py-10 text-center">
              <BarChart3 size={24} className="mb-2 text-muted" />
              <p className="text-sm text-muted">Nenhum período lançado ainda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {relatorios.map((r, i) => (
                <RelatorioCard key={r.id} relatorio={r} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
