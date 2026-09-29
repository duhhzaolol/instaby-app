"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, FileBarChart, ExternalLink, AlertTriangle, History } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { STATUS_INTERNO_LABEL, formatarNumeroOuNaoInformado } from "@/lib/trafego";

type CampanhaOpcao = { id: string; nome: string; statusInterno: string };
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
};
type Previa = {
  porCampanha: CampanhaSnapshotRelatorio[];
  investimentoTotal: number;
  dataAtualizacaoDados: string;
  parcial: boolean;
};

function fmtMoeda(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
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

  const idsSelecionados = Object.keys(selecionadas).filter((id) => selecionadas[id]);

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
    const resp = await fetch("/api/relatorios-trafego/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId, periodoInicio, periodoFim, campanhaIds: idsSelecionados }),
    });
    const json = await resp.json();
    setCarregandoPrevia(false);
    if (!resp.ok) {
      setErro(json.erro || "Não consegui montar a prévia.");
      return;
    }
    setPrevia(json);
  }

  async function gerarPdf() {
    if (idsSelecionados.length === 0) {
      setErro("Selecione ao menos uma campanha.");
      return;
    }
    setGerando(true);
    setErro("");
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
    setGerando(false);
    if (!resp.ok) {
      setErro(json.erro || "Não consegui gerar o relatório.");
      return;
    }
    router.refresh();
    window.open(`/relatorio-trafego/${json.id}`, "_blank");
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
        {campanhas.length === 0 ? (
          <p className="mb-3 text-xs text-muted">Esse cliente ainda não tem campanhas cadastradas.</p>
        ) : (
          <div className="mb-3 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-2">
            {campanhas.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-text hover:bg-hover">
                <input type="checkbox" checked={!!selecionadas[c.id]} onChange={() => alternar(c.id)} />
                {c.nome}
                <span className="text-[10px] text-muted">{STATUS_INTERNO_LABEL[c.statusInterno] || c.statusInterno}</span>
              </label>
            ))}
          </div>
        )}

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
            disabled={carregandoPrevia || campanhas.length === 0}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-base/60 text-xs font-medium text-text hover:bg-hover disabled:opacity-40"
          >
            <Eye size={13} /> {carregandoPrevia ? "Calculando..." : "Ver prévia"}
          </button>
          <button
            onClick={gerarPdf}
            disabled={gerando || campanhas.length === 0}
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
          <div className="flex flex-col gap-2">
            {previa.porCampanha.map((c) => (
              <div key={c.campanhaId} className="rounded-xl border border-border bg-base/40 p-2.5 text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-medium text-text">{c.nome}</p>
                  <p className="text-text">{fmtMoeda(c.gasto)}</p>
                </div>
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
                  {dataBr(v.periodoInicio)} – {dataBr(v.periodoFim)} · gerado {dataBr(v.createdAt)}
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
