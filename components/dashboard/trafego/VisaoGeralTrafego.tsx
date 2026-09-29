"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, TrendingDown, PiggyBank, CalendarClock, RefreshCw, Search, FileBarChart } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { STATUS_INTERNO, STATUS_INTERNO_LABEL, AVALIACAO_LABEL, formatarNumeroOuNaoInformado } from "@/lib/trafego";

type GrupoResultado = { indicador: string; label: string; total: number; qtdCampanhas: number };
type SnapshotView = {
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: GrupoResultado[];
  dataAtualizacao: string | null;
  temDados: boolean;
};
type CampanhaLinha = {
  id: string;
  nome: string;
  statusInterno: string;
  ultimoStatusMeta: string | null;
  avaliacao: string;
  snapshot: SnapshotView;
};
type Saldo = {
  temVerbaCadastrada: boolean;
  saldoInicial: number;
  totalAportes: number;
  totalDevolucoes: number;
  totalAjustes: number;
  totalSaldoTransportado: number;
  gastoAcumulado: number;
  saldoRestante: number;
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function VisaoGeralTrafego({
  clienteId,
  saldo,
  campanhas,
  periodoLabel,
  ultimaAtualizacao,
}: {
  clienteId: string;
  clienteNome: string;
  saldo: Saldo;
  campanhas: CampanhaLinha[];
  periodoLabel: string;
  ultimaAtualizacao: string | null;
}) {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>({});

  const verbaTotal = saldo.saldoInicial + saldo.totalAportes + saldo.totalSaldoTransportado;
  const idsSelecionados = Object.keys(selecionadas).filter((id) => selecionadas[id]);

  const filtradas = campanhas.filter((c) => {
    if (filtroStatus && c.statusInterno !== filtroStatus) return false;
    if (busca.trim() && !c.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    return true;
  });

  const maiorGasto = Math.max(1, ...campanhas.map((c) => c.snapshot.gasto));

  function alternarSelecao(id: string) {
    setSelecionadas((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          icone={<PiggyBank size={12} style={{ color: "#0D9488" }} />}
          label="Verba disponibilizada"
          valor={saldo.temVerbaCadastrada ? fmtMoeda(verbaTotal) : "—"}
          sub={!saldo.temVerbaCadastrada ? "Nenhuma verba cadastrada" : undefined}
          index={0}
        />
        <StatTile
          icone={<TrendingDown size={12} style={{ color: "#E63946" }} />}
          label="Gasto acumulado"
          valor={fmtMoeda(saldo.gastoAcumulado)}
          index={1}
        />
        <StatTile
          icone={<Wallet size={12} style={{ color: saldo.saldoRestante < 0 ? "#E63946" : "#22C55E" }} />}
          label="Saldo restante"
          valor={saldo.temVerbaCadastrada ? fmtMoeda(saldo.saldoRestante) : "—"}
          index={2}
        />
        <StatTile icone={<CalendarClock size={12} className="text-muted" />} label="Período" valor={periodoLabel} index={3} />
        <StatTile
          icone={<RefreshCw size={12} className="text-muted" />}
          label="Última atualização"
          valor={ultimaAtualizacao ? dataBr(ultimaAtualizacao) : "Sem importações"}
          index={4}
        />
      </div>

      {!saldo.temVerbaCadastrada && (
        <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
          Esse cliente ainda não tem verba cadastrada — o gasto acima já é calculado, mas o saldo só aparece depois de
          registrar a verba disponibilizada em "Verba e movimentações".
        </p>
      )}

      {campanhas.length > 0 && (
        <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-3 text-sm font-medium text-text">Gasto por campanha no período</p>
          <div className="flex flex-col gap-1.5">
            {campanhas.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <p className="w-28 shrink-0 truncate text-[11px] text-muted sm:w-40" title={c.nome}>
                  {c.nome}
                </p>
                <div className="h-4 flex-1 overflow-hidden rounded bg-base/60">
                  <div
                    className="h-full rounded bg-accent transition-all"
                    style={{ width: `${Math.max(2, (c.snapshot.gasto / maiorGasto) * 100)}%` }}
                  />
                </div>
                <p className="w-20 shrink-0 text-right text-[11px] text-text">{fmtMoeda(c.snapshot.gasto)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="h-9 w-full rounded-lg border border-border bg-base/60 pl-8 pr-3 text-xs text-text placeholder:text-muted/60"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="h-9 rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
        >
          <option value="">Todos os status</option>
          {STATUS_INTERNO.map((s) => (
            <option key={s} value={s}>
              {STATUS_INTERNO_LABEL[s]}
            </option>
          ))}
        </select>
        {idsSelecionados.length > 0 && (
          <Link
            href={`/dashboard/trafego?visao=relatorios&clienteId=${clienteId}&campanhaIds=${idsSelecionados.join(",")}`}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-white hover:opacity-90"
          >
            <FileBarChart size={12} /> Gerar relatório com {idsSelecionados.length} selecionada
            {idsSelecionados.length === 1 ? "" : "s"}
          </Link>
        )}
      </div>

      {campanhas.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
          Nenhuma campanha em acompanhamento pra esse cliente ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-card text-muted">
              <tr>
                <th className="w-8 p-2.5"></th>
                <th className="p-2.5 text-left font-medium">Campanha</th>
                <th className="p-2.5 text-left font-medium">Status</th>
                <th className="p-2.5 text-right font-medium">Gasto</th>
                <th className="p-2.5 text-left font-medium">Resultados</th>
                <th className="p-2.5 text-right font-medium">Custo/resultado</th>
                <th className="p-2.5 text-right font-medium">Impressões</th>
                <th className="p-2.5 text-right font-medium">Alcance</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="p-2.5">
                    <input type="checkbox" checked={!!selecionadas[c.id]} onChange={() => alternarSelecao(c.id)} />
                  </td>
                  <td className="max-w-[180px] truncate p-2.5 text-text" title={c.nome}>
                    {c.nome}
                    {c.avaliacao !== "nao_avaliada" && (
                      <span className="ml-1.5 text-[10px] text-muted">· {AVALIACAO_LABEL[c.avaliacao]}</span>
                    )}
                  </td>
                  <td className="p-2.5 text-muted">{STATUS_INTERNO_LABEL[c.statusInterno] || c.statusInterno}</td>
                  <td className="p-2.5 text-right text-text">{fmtMoeda(c.snapshot.gasto)}</td>
                  <td className="p-2.5">
                    {!c.snapshot.temDados || c.snapshot.resultadosPorIndicador.length === 0 ? (
                      <span className="text-muted">não informado</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {c.snapshot.resultadosPorIndicador.map((r) => (
                          <span key={r.indicador} className="text-text">
                            {r.total.toLocaleString("pt-BR")} <span className="text-muted">{r.label}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-right">
                    {c.snapshot.resultadosPorIndicador.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {c.snapshot.resultadosPorIndicador.map((r) => (
                          <span key={r.indicador} className="text-text">
                            {r.total > 0 ? `R$ ${(c.snapshot.gasto / r.total).toFixed(2)}` : "—"}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-right text-text">{formatarNumeroOuNaoInformado(c.snapshot.impressoes)}</td>
                  <td className="p-2.5 text-right text-text">{formatarNumeroOuNaoInformado(c.snapshot.alcance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted/70">
        Alcance é individual por campanha — somar as linhas não equivale a pessoas únicas atingidas no total.
      </p>
    </div>
  );
}
