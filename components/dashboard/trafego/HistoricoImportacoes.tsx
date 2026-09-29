"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, History, ExternalLink, AlertTriangle } from "lucide-react";
import ImportarCampanhasMeta from "@/components/dashboard/ImportarCampanhasMeta";

type ItemLote = {
  id: string;
  nomeOriginal: string;
  campanhaNomeAtual: string | null;
  gastoAcumuladoArquivo: number;
  gastoAnterior: number;
  gastoIncremental: number;
  resolucao: string;
};
type Lote = {
  id: string;
  nomeArquivo: string;
  arquivoUrl: string;
  periodoInicio: string;
  periodoFim: string;
  arquivoAntigo: boolean;
  linhasTotal: number;
  linhasComGasto: number;
  gastoTotalArquivo: number;
  criadoPorNome: string | null;
  createdAt: string;
  itens: ItemLote[];
};

const RESOLUCAO_LABEL: Record<string, string> = {
  auto_id: "Reconhecida por ID",
  auto_chave: "Reconhecida por nome + atribuição",
  manual: "Vinculada manualmente",
  nova_campanha: "Campanha nova",
  pendente: "Pendente",
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function dataHoraBr(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

function LoteCard({ lote }: { lote: Lote }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <button onClick={() => setAberto((v) => !v)} className="flex w-full items-start justify-between gap-2 text-left">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-text">
            <FileText size={13} className="shrink-0 text-accent" />
            <span className="truncate">{lote.nomeArquivo}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {dataBr(lote.periodoInicio)} – {dataBr(lote.periodoFim)} · {lote.linhasTotal} campanha(s), {lote.linhasComGasto}{" "}
            com gasto · {fmtMoeda(lote.gastoTotalArquivo)} no arquivo
          </p>
          <p className="mt-0.5 text-[11px] text-muted/70">
            Importado {dataHoraBr(lote.createdAt)}
            {lote.criadoPorNome && ` por ${lote.criadoPorNome}`}
          </p>
          {lote.arquivoAntigo && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
              <History size={11} /> Confirmado como correção de um período mais antigo.
            </p>
          )}
        </div>
        {aberto ? <ChevronUp size={14} className="mt-1 shrink-0 text-muted" /> : <ChevronDown size={14} className="mt-1 shrink-0 text-muted" />}
      </button>

      {aberto && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <a
            href={lote.arquivoUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-2 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
          >
            <ExternalLink size={11} /> Abrir arquivo original importado
          </a>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-[11px]">
              <thead className="bg-base/60 text-muted">
                <tr>
                  <th className="p-2 text-left font-medium">Nome no arquivo</th>
                  <th className="p-2 text-left font-medium">Campanha atual</th>
                  <th className="p-2 text-left font-medium">Situação</th>
                  <th className="p-2 text-right font-medium">Gasto anterior</th>
                  <th className="p-2 text-right font-medium">Gasto atualizado</th>
                  <th className="p-2 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {lote.itens.map((item) => (
                  <tr key={item.id} className="border-t border-border/60">
                    <td className="max-w-[140px] truncate p-2 text-muted" title={item.nomeOriginal}>
                      {item.nomeOriginal}
                    </td>
                    <td className="max-w-[140px] truncate p-2 text-text" title={item.campanhaNomeAtual || ""}>
                      {item.campanhaNomeAtual || "—"}
                    </td>
                    <td className="p-2 text-muted">{RESOLUCAO_LABEL[item.resolucao] || item.resolucao}</td>
                    <td className="p-2 text-right text-muted">{fmtMoeda(item.gastoAnterior)}</td>
                    <td className="p-2 text-right text-text">{fmtMoeda(item.gastoAcumuladoArquivo)}</td>
                    <td className={`p-2 text-right font-medium ${item.gastoIncremental < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {item.gastoIncremental >= 0 ? "+" : ""}
                      {fmtMoeda(item.gastoIncremental)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoricoImportacoes({
  clienteId,
  clienteNome,
  lotes,
}: {
  clienteId: string;
  clienteNome: string;
  lotes: Lote[];
}) {
  return (
    <div>
      <ImportarCampanhasMeta clientes={[{ id: clienteId, nome: clienteNome }]} clienteFixo={clienteId} />

      {lotes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
          Nenhuma importação registrada ainda pra esse cliente.
        </p>
      ) : (
        <div>
          <p className="mb-2 flex items-start gap-1.5 text-[11px] text-muted">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Cada linha aqui é uma correção preservada — reimportar o mesmo arquivo não duplica campanha nem desconta
            dinheiro de novo, e um arquivo antigo nunca substitui automaticamente um dado mais recente.
          </p>
          <div className="flex flex-col gap-2">
            {lotes.map((l) => (
              <LoteCard key={l.id} lote={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
