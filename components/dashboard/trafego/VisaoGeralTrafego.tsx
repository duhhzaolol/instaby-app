"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, TrendingDown, PiggyBank, CalendarClock, RefreshCw, Search, FileBarChart, Eye, Megaphone, Repeat, BarChart3 } from "lucide-react";
import { EvolucaoImportacoes, type MarcoImportacao } from "./EvolucaoImportacoes";
import { AvaliarCampanha } from "./AvaliarCampanha";
import { StatTile } from "@/components/ui/StatTile";
import { STATUS_INTERNO, STATUS_INTERNO_LABEL, AVALIACAO_LABEL, formatarNumeroOuNaoInformado } from "@/lib/trafego";
import { custoPorMilImpressoes, frequenciaCampanha } from "@/lib/metricasTrafego";

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
  avaliacaoMeta?: string | null;
  avaliacaoObservacoes?: string | null;
  dataInicio: string;
  dataFim: string | null;
  detalhesMeta?: {
    configAtribuicao: string | null;
    custoPorResultado: number | null;
    orcamentoConjunto: number | null;
    tipoOrcamento: string | null;
  };
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
  gastoHistorico: number;
  gastosPorMes: { mes: string; gasto: number }[];
  inicioControle: string | null;
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function VisaoGeralTrafego({
  clienteId,
  saldo,
  campanhas,
  periodoLabel,
  ultimaAtualizacao,
  gastoMes,
  fechado,
  marcos,
}: {
  clienteId: string;
  clienteNome: string;
  saldo: Saldo;
  campanhas: CampanhaLinha[];
  periodoLabel: string;
  ultimaAtualizacao: string | null;
  gastoMes: number | null;
  fechado: boolean;
  marcos: MarcoImportacao[];
}) {
  const [ocultarZeros, setOcultarZeros] = useState(true);
  const [avaliando, setAvaliando] = useState<CampanhaLinha | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>({});

  const verbaTotal = saldo.saldoInicial + saldo.totalAportes + saldo.totalSaldoTransportado;
  const idsSelecionados = Object.keys(selecionadas).filter((id) => selecionadas[id]);

  const visiveis = campanhas.filter((c) => !ocultarZeros || c.snapshot.gasto > 0).sort((a,b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  const filtradas = visiveis.filter((c) => {
    if (filtroStatus && c.statusInterno !== filtroStatus) return false;
    if (busca.trim() && !c.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    return true;
  });

  const maiorGasto = Math.max(1, ...campanhas.map((c) => c.snapshot.gasto));
  const ultimoMarco = marcos[marcos.length - 1];
  const campanhasComGasto = campanhas.filter((c) => c.snapshot.gasto > 0);
  const campanhaUnica = campanhasComGasto.length === 1 ? campanhasComGasto[0] : null;
  const cpm = ultimoMarco && !ultimoMarco.impressoesParciais ? custoPorMilImpressoes(ultimoMarco.gasto, ultimoMarco.impressoes) : null;
  const frequencia = campanhaUnica ? frequenciaCampanha(campanhaUnica.snapshot.impressoes, campanhaUnica.snapshot.alcance) : null;

  function alternarSelecao(id: string) {
    setSelecionadas((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-border bg-card/60 p-4">
        <p className="text-xs text-muted">{fechado ? "Fechamento do mês" : "Acumulado do mês"} · {periodoLabel}</p>
        <p className="mt-1 text-xl font-semibold text-text">{gastoMes == null ? "—" : fmtMoeda(gastoMes)}</p>
        <p className="mt-1 text-[11px] text-muted">Total do último arquivo do mês, incluindo todas as campanhas presentes no relatório. As importações anteriores ficam como marcos.</p>
      </div>
      <EvolucaoImportacoes marcos={marcos}/>
      {ultimoMarco && <div className="mb-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile icone={<Megaphone size={12} className="text-accent" />} label="Campanhas com gasto" valor={campanhasComGasto.length.toLocaleString("pt-BR")} sub="No último relatório do mês" index={0}/>
        <StatTile icone={<BarChart3 size={12} style={{ color: "#38BDF8" }}/>} label="CPM do mês" valor={cpm == null ? "—" : fmtMoeda(cpm)} sub={ultimoMarco.impressoesParciais ? "Faltam impressões em parte das campanhas" : "Custo por mil impressões"} index={1}/>
        <StatTile icone={<Eye size={12} style={{ color: "#A78BFA" }}/>} label={campanhaUnica ? "Alcance da campanha" : "Alcance por campanha"} valor={campanhaUnica ? formatarNumeroOuNaoInformado(campanhaUnica.snapshot.alcance) : "Na tabela"} sub={campanhaUnica ? "Contas alcançadas no período" : "Pessoas podem se repetir entre campanhas"} index={2}/>
        <StatTile icone={<Repeat size={12} style={{ color: "#0D9488" }}/>} label={campanhaUnica ? "Frequência da campanha" : "Frequência por campanha"} valor={campanhaUnica ? (frequencia == null ? "—" : `${frequencia.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`) : "Na tabela"} sub="Média de impressões por conta alcançada" index={3}/>
      </div>}
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
          label="Gasto do mês selecionado"
          valor={gastoMes == null ? "—" : fmtMoeda(gastoMes)}
          index={1}
        />
        <StatTile
          icone={<Wallet size={12} style={{ color: saldo.saldoRestante < 0 ? "#E63946" : "#22C55E" }} />}
          label="Saldo do controle de verba"
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
          cadastrar a verba de anúncios. <Link href={`/dashboard/trafego?visao=verba&clienteId=${clienteId}`} className="ml-1 underline">Cadastrar verba de anúncios</Link>
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={ocultarZeros} onChange={(e) => setOcultarZeros(e.target.checked)}/>Ocultar campanhas sem gasto no mês</label>
        <Link href={`/dashboard/trafego?visao=verba&clienteId=${clienteId}`} className="text-xs text-accent underline">Configurar verba de anúncios</Link>
      </div>
      <details className="mb-4 rounded-xl border border-border p-3 text-xs text-muted"><summary className="cursor-pointer">Ver gastos dos meses anteriores e origem do histórico</summary><p className="mt-2">Histórico registrado: {fmtMoeda(saldo.gastoHistorico)}. O valor do mês selecionado é {gastoMes == null ? "—" : fmtMoeda(gastoMes)}.</p>{saldo.gastosPorMes.map((m) => <p key={m.mes}>{dataBr(`${m.mes}-01`)} · {fmtMoeda(m.gasto)}</p>)}<p className="mt-2">O saldo de verba considera {saldo.inicioControle ? `os registros a partir de ${dataBr(saldo.inicioControle)}` : "todos os meses registrados, até definir um mês de início do controle"}.</p></details>
      {visiveis.length > 0 && (
        <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-3 text-sm font-medium text-text">Gasto por campanha no período</p>
          <div className="flex flex-col gap-1.5">
            {visiveis.map((c) => (
              <div key={c.id}>
                <p className="mb-1 break-words text-[11px] text-muted">
                  {c.nome}
                </p>
                <div className="flex items-center gap-2"><div className="h-4 flex-1 overflow-hidden rounded bg-base/60">
                  <div
                    className="h-full rounded bg-accent transition-all"
                    style={{ width: `${Math.max(2, (c.snapshot.gasto / maiorGasto) * 100)}%` }}
                  />
                </div>
                <p className="w-20 shrink-0 text-right text-[11px] text-text">{fmtMoeda(c.snapshot.gasto)}</p></div>
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

      {avaliando && <AvaliarCampanha campanha={avaliando} onFechar={() => setAvaliando(null)}/>}
      <p className="mb-2 text-[11px] text-muted">Início cadastrado e fim informado são datas da campanha. O período do relatório não informa o início real da veiculação.</p>
      {filtradas.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
          Nenhuma campanha com gasto para os filtros escolhidos.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-card text-muted">
              <tr>
                <th className="w-8 p-2.5"></th>
                <th className="p-2.5 text-left font-medium">Campanha</th>
                <th className="p-2.5 text-left font-medium">Status</th>
                <th className="p-2.5 text-left font-medium">Início cadastrado</th>
                <th className="p-2.5 text-left font-medium">Fim informado</th>
                <th className="p-2.5 text-right font-medium">Gasto</th>
                <th className="p-2.5 text-left font-medium">Resultados</th>
                <th className="p-2.5 text-right font-medium">Custo/resultado</th>
                <th className="p-2.5 text-right font-medium">Impressões</th>
                <th className="p-2.5 text-right font-medium">Alcance</th>
                <th className="p-2.5 text-right font-medium">CPM</th>
                <th className="p-2.5 text-right font-medium">Frequência</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="p-2.5">
                    <input type="checkbox" checked={!!selecionadas[c.id]} onChange={() => alternarSelecao(c.id)} />
                  </td>
                  <td className="min-w-[220px] whitespace-normal break-words p-2.5 text-text">
                    {c.nome}
                    {c.avaliacao !== "nao_avaliada" && (
                      <span className="ml-1.5 text-[10px] text-muted">· {AVALIACAO_LABEL[c.avaliacao]}</span>
                    )}
                    <button onClick={() => setAvaliando(c)} className="mt-1 block text-[11px] text-accent underline">Avaliar campanha</button>
                    {c.detalhesMeta && <details className="mt-2 text-[11px] text-muted">
                      <summary className="cursor-pointer text-accent">Detalhes do arquivo</summary>
                      <dl className="mt-2 space-y-1">
                        <div><dt className="inline font-medium">Atribuição: </dt><dd className="inline">{c.detalhesMeta.configAtribuicao || "Não informada"}</dd></div>
                        <div><dt className="inline font-medium">Orçamento do conjunto: </dt><dd className="inline">{c.detalhesMeta.orcamentoConjunto == null ? "Não informado" : fmtMoeda(c.detalhesMeta.orcamentoConjunto)}{c.detalhesMeta.tipoOrcamento ? ` · ${c.detalhesMeta.tipoOrcamento}` : ""}</dd></div>
                        <div><dt className="inline font-medium">Custo/resultado informado: </dt><dd className="inline">{c.detalhesMeta.custoPorResultado == null ? "Não informado" : fmtMoeda(c.detalhesMeta.custoPorResultado)}</dd></div>
                      </dl>
                    </details>}
                  </td>
                  <td className="p-2.5 text-muted">{STATUS_INTERNO_LABEL[c.statusInterno] || c.statusInterno}</td>
                  <td className="whitespace-nowrap p-2.5 text-muted">{dataBr(c.dataInicio)}</td>
                  <td className="whitespace-nowrap p-2.5 text-muted">{c.dataFim ? dataBr(c.dataFim) : "Não informado"}</td>
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
                            {r.total > 0 && r.indicador !== "(sem indicador)" ? fmtMoeda(c.snapshot.gasto / r.total) : "—"}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-right text-text">{formatarNumeroOuNaoInformado(c.snapshot.impressoes)}</td>
                  <td className="p-2.5 text-right text-text">{formatarNumeroOuNaoInformado(c.snapshot.alcance)}</td>
                  <td className="whitespace-nowrap p-2.5 text-right text-text">{custoPorMilImpressoes(c.snapshot.gasto, c.snapshot.impressoes) == null ? "—" : fmtMoeda(custoPorMilImpressoes(c.snapshot.gasto, c.snapshot.impressoes)!)}</td>
                  <td className="p-2.5 text-right text-text">{frequenciaCampanha(c.snapshot.impressoes, c.snapshot.alcance) == null ? "—" : `${frequenciaCampanha(c.snapshot.impressoes, c.snapshot.alcance)!.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`}</td>
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
