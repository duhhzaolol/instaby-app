"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, FileBarChart, ExternalLink, AlertTriangle, History } from "lucide-react";
import { AvaliarCampanha } from "./AvaliarCampanha";
import { DatePicker } from "@/components/ui/DatePicker";
import { STATUS_INTERNO_LABEL, AVALIACAO_LABEL, formatarNumeroOuNaoInformado } from "@/lib/trafego";

type CampanhaOpcao = { id: string; nome: string; statusInterno: string; gasto?: number; avaliacao: string; avaliacaoMeta?: string | null; avaliacaoObservacoes?: string | null };
type VersaoRelatorio = {
  id: string;
  versao: number;
  periodoInicio: string;
  periodoFim: string;
  parcial: boolean;
  geradoPorNome: string | null;
  createdAt: string;
};
type GrupoResultado = { indicador: string; label: string; total: number; qtdCampanhas: number };
type CampanhaSnapshotRelatorio = {
  campanhaId: string;
  nome: string;
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: GrupoResultado[];
  temDados: boolean;
  avaliacao: string;
};
type Previa = {
  porCampanha: CampanhaSnapshotRelatorio[];
  investimentoTotal: number;
  dataAtualizacaoDados: string;
  parcial: boolean;
  retorno?: { apuradoAte: string; resumo: { receita: number; quantidade: number } } | null;
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function RelatoriosTrafego({
  clienteId,
  campanhas,
  versoes,
  periodoInicioDefault,
  periodoFimDefault,
  campanhaIdsPreSelecionadas,
}: {
  clienteId: string;
  clienteNome: string;
  campanhas: CampanhaOpcao[];
  versoes: VersaoRelatorio[];
  periodoInicioDefault: string;
  periodoFimDefault: string;
  campanhaIdsPreSelecionadas?: string[];
}) {
  const router = useRouter();
  const [disponiveis, setDisponiveis] = useState<CampanhaOpcao[]>([]);
  const [buscando, setBuscando] = useState(true);
  const [avaliando, setAvaliando] = useState<CampanhaOpcao | null>(null);
  const [recarregarOpcoes, setRecarregarOpcoes] = useState(0);
  const [periodoInicio, setPeriodoInicio] = useState(periodoInicioDefault);
  const [periodoFim, setPeriodoFim] = useState(periodoFimDefault);
  const [selecionadas, setSelecionadas] = useState<Record<string, boolean>>(
    Object.fromEntries((campanhaIdsPreSelecionadas || []).map((id) => [id, true]))
  );
  const [avaliacaoGeral, setAvaliacaoGeral] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [proximosPassos, setProximosPassos] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setBuscando(true); setPrevia(null); setErro("");
    fetch(`/api/clientes/${clienteId}/campanhas-periodo?inicio=${encodeURIComponent(periodoInicio)}&fim=${encodeURIComponent(periodoFim)}`, { signal: controller.signal })
      .then(async (r) => { const json = await r.json(); if (!r.ok) throw new Error(json.erro || "Não foi possível consultar o período."); return json as CampanhaOpcao[]; })
      .then((lista) => { if (controller.signal.aborted) return; setDisponiveis(lista); setSelecionadas((atual) => Object.fromEntries(lista.map((c) => [c.id, atual[c.id] ?? (!campanhaIdsPreSelecionadas || campanhaIdsPreSelecionadas.includes(c.id))]))); })
      .catch((e) => { if (!controller.signal.aborted) { setDisponiveis([]); setSelecionadas({}); setErro(e.message || "Não foi possível consultar o período."); } })
      .finally(() => { if (!controller.signal.aborted) setBuscando(false); });
    return () => controller.abort();
  }, [clienteId, periodoInicio, periodoFim, recarregarOpcoes]);
  const idsSelecionados = disponiveis.filter((c) => selecionadas[c.id]).map((c) => c.id);

  function alternar(id: string) {
    setSelecionadas((s) => ({ ...s, [id]: !s[id] }));
    setPrevia(null);
  }

  async function verPrevia() {
    if (idsSelecionados.length === 0) {
      setErro("Selecione ao menos uma campanha.");
      return;
    }
    setCarregandoPrevia(true);
    setErro("");
    try {
      const resp = await fetch("/api/relatorios-trafego/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, periodoInicio, periodoFim, campanhaIds: idsSelecionados }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.erro || "Não consegui montar a prévia.");
        return;
      }
      setPrevia(json);
    } catch {
      setErro("Não foi possível completar a solicitação. Tente novamente.");
    } finally {
      setCarregandoPrevia(false);
    }
  }

  async function gerarPdf() {
    if (idsSelecionados.length === 0) {
      setErro("Selecione ao menos uma campanha.");
      return;
    }
    setGerando(true);
    setErro("");
    try {
      const resp = await fetch("/api/relatorios-trafego", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          periodoInicio,
          periodoFim,
          campanhaIds: idsSelecionados,
          avaliacaoGeral: avaliacaoGeral || null,
          observacoes: observacoes || null,
          proximosPassos: proximosPassos || null,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setErro(json.erro || "Não consegui gerar o relatório.");
        return;
      }
      router.refresh();
      window.open(`/relatorio-trafego/${json.id}`, "_blank");
    } catch {
      setErro("Não foi possível completar a solicitação. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
        <p className="mb-3 text-sm font-medium text-text">Novo relatório</p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <DatePicker value={periodoInicio} onChange={(v) => { setPeriodoInicio(v); setPrevia(null); }} placeholder="Início do período" />
          <DatePicker value={periodoFim} onChange={(v) => { setPeriodoFim(v); setPrevia(null); }} placeholder="Fim do período" />
        </div>

        <p className="mb-1.5 text-xs font-medium text-text">Campanhas</p>
        <p className="mb-2 text-xs text-muted">Só aparecem campanhas com gasto no período selecionado. A avaliação da campanha é salva pelo botão “Avaliar”; a avaliação geral abaixo é um comentário do relatório.</p>
        {buscando ? <p className="mb-3 text-xs text-muted">Buscando campanhas do período...</p> : disponiveis.length === 0 ? (
          <p className="mb-3 text-xs text-muted">Nenhuma campanha com gasto nesse período. Ajuste as datas ou importe um relatório desse intervalo.</p>
        ) : (
          <div className="mb-3 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-2">
            {disponiveis.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-xs text-text hover:bg-hover"><label className="flex flex-1 items-center gap-2">
                <input type="checkbox" checked={!!selecionadas[c.id]} onChange={() => alternar(c.id)} />
                {c.nome}
                <span className="text-[10px] text-muted">{STATUS_INTERNO_LABEL[c.statusInterno] || c.statusInterno}</span>
              </label><button onClick={() => setAvaliando(c)} className="text-xs text-accent underline">Avaliar campanha</button></div>
            ))}
          </div>
        )}

        {avaliando && <AvaliarCampanha campanha={avaliando} onFechar={() => { setAvaliando(null); setRecarregarOpcoes((v) => v+1); }}/>}
        <textarea
          value={avaliacaoGeral}
          onChange={(e) => setAvaliacaoGeral(e.target.value)}
          rows={2}
          placeholder="Avaliação geral do período (opcional)"
          className="mb-2 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
        />
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          placeholder="Observações (opcional)"
          className="mb-2 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
        />
        <textarea
          value={proximosPassos}
          onChange={(e) => setProximosPassos(e.target.value)}
          rows={2}
          placeholder="Próximos passos (opcional)"
          className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
        />

        {erro && (
          <p className="mb-2 flex items-center gap-1 text-[11px] text-red-400">
            <AlertTriangle size={11} /> {erro}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={verPrevia}
            disabled={carregandoPrevia || buscando || idsSelecionados.length === 0}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-base/60 text-xs font-medium text-text hover:bg-hover disabled:opacity-40"
          >
            <Eye size={13} /> {carregandoPrevia ? "Calculando..." : "Ver prévia"}
          </button>
          <button
            onClick={gerarPdf}
            disabled={gerando || buscando || idsSelecionados.length === 0}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-xs font-semibold text-white disabled:opacity-40"
          >
            <FileBarChart size={13} /> {gerando ? "Gerando..." : "Gerar relatório (PDF)"}
          </button>
        </div>
      </div>

      {previa && (
        <div className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-text">Prévia</p>
            {previa.parcial && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                Parcial — não cobre o período inteiro
              </span>
            )}
          </div>
          <p className="mb-3 text-xs text-muted">
            Investimento total: <span className="font-medium text-text">{fmtMoeda(previa.investimentoTotal)}</span> · dados até{" "}
            {dataBr(previa.dataAtualizacaoDados)}
          </p>
          {previa.retorno && <p className="mb-3 text-xs text-muted">Vendas salvas do mês: {previa.retorno.resumo.quantidade} · receita {fmtMoeda(previa.retorno.resumo.receita)} · apuradas até {dataBr(previa.retorno.apuradoAte)}</p>}
          <div className="flex flex-col gap-2">
            {previa.porCampanha.map((c) => (
              <div key={c.campanhaId} className="rounded-xl border border-border bg-base/40 p-2.5 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium text-text">{c.nome}</p>
                  <p className="text-text">{fmtMoeda(c.gasto)}</p>
                </div>
                <p className="mb-1 text-[11px] text-muted">Avaliação da campanha: {AVALIACAO_LABEL[c.avaliacao] || "Não avaliada"}</p>
                {!c.temDados ? (
                  <p className="text-[11px] text-muted">Sem dados nesse período.</p>
                ) : (
                  <p className="text-[11px] text-muted">
                    {formatarNumeroOuNaoInformado(c.impressoes)} impressões · {formatarNumeroOuNaoInformado(c.alcance)} alcance
                    {c.resultadosPorIndicador.map((r) => ` · ${r.total.toLocaleString("pt-BR")} ${r.label}`).join("")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text">
        <History size={13} /> Versões geradas
      </p>
      {versoes.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">Nenhum relatório gerado ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {versoes.map((v) => (
            <Link
              key={v.id}
              href={`/relatorio-trafego/${v.id}`}
              target="_blank"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3.5 py-2.5 hover:border-accent/40"
            >
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-text">
                  Versão {v.versao}
                  {v.parcial && <span className="text-[10px] text-amber-400">(parcial)</span>}
                </p>
                <p className="text-[11px] text-muted">
                  {dataBr(v.periodoInicio)} – {dataBr(v.periodoFim)} · gerado {new Date(v.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  {v.geradoPorNome && ` por ${v.geradoPorNome}`}
                </p>
              </div>
              <ExternalLink size={13} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
