"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, X, Check, Trash2, Pencil, TrendingUp, DollarSign, Target, Percent, Eye, Trophy, Users, Repeat, Coins } from "lucide-react";
import { EvolucaoImportacoes } from "@/components/dashboard/trafego/EvolucaoImportacoes";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { totalizarResultados, agruparPorMes, ehAcumuladoMensal, marcosAcumuladosMensais } from "@/lib/agregarResultadosCampanha";
import { formatarDataRelatorio } from "@/lib/dataRelatorio";
import { labelIndicador } from "@/lib/indicadoresMeta";

// Cores da mini-visão de tendência — vermelho da marca pra custo (dinheiro saindo),
// verde-azulado pra resultado (o que "entra" de retorno). Validadas com o script de
// contraste/CVD do design system (dataviz skill) contra o fundo do card (#1C2028):
// ΔE 11.6 (deutan), bem acima do alvo de 8 — seguro mesmo lado a lado.
const COR_CUSTO = "#E63946";
const COR_RESULTADOS = "#0D9488";
// Âmbar pro fechamento/retorno — mesma cor já usada em status "pausada" no resto do
// módulo, então não é uma cor nova no vocabulário do app; aqui marca "resultado em R$".
const COR_RETORNO = "#F59E0B";

function fmtMoedaCompacta(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Resultado = {
  id: string;
  campanhaId: string;
  createdAt: string;
  inicio: string;
  fim: string;
  verbaInvestida: number | null;
  impressoes: number | null;
  alcance: number | null;
  cliques: number | null;
  resultados: number | null;
  indicadorResultado: string | null;
  origem: string;
  observacoes: string | null;
  planosFechados: number | null;
  valorRetorno: number | null;
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function numOuNulo(v: string) {
  return v === "" ? null : Number(v);
}

function NovoResultadoForm({ campanhaId, onSalvo }: { campanhaId: string; onSalvo: () => void }) {
  const router = useRouter();
  const [inicio, setInicio] = useState(new Date().toLocaleDateString("en-CA"));
  const [fim, setFim] = useState(new Date().toLocaleDateString("en-CA"));
  const [verbaInvestida, setVerbaInvestida] = useState(0);
  const [impressoes, setImpressoes] = useState("");
  const [alcance, setAlcance] = useState("");
  const [cliques, setCliques] = useState("");
  const [resultados, setResultados] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [planosFechados, setPlanosFechados] = useState("");
  const [valorRetorno, setValorRetorno] = useState(0);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!inicio || !fim) return;
    setEnviando(true);
    await fetch(`/api/campanhas/${campanhaId}/resultados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inicio,
        fim,
        verbaInvestida: verbaInvestida || null,
        impressoes: numOuNulo(impressoes),
        alcance: numOuNulo(alcance),
        cliques: numOuNulo(cliques),
        resultados: numOuNulo(resultados),
        observacoes: observacoes || null,
        planosFechados: numOuNulo(planosFechados),
        valorRetorno: valorRetorno || null,
      }),
    });
    setEnviando(false);
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="mt-2 rounded-xl border border-border bg-base/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-text">Novo resultado</p>
        <button type="button" onClick={onSalvo} className="text-muted hover:text-text">
          <X size={14} />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <DatePicker value={inicio} onChange={setInicio} placeholder="Início do período" />
        <DatePicker value={fim} onChange={setFim} placeholder="Fim do período" />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <CurrencyInput value={verbaInvestida} onChange={setVerbaInvestida} placeholder="Verba investida" />
        <input
          type="number"
          min={0}
          value={impressoes}
          onChange={(e) => setImpressoes(e.target.value)}
          placeholder="Impressões"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={alcance}
          onChange={(e) => setAlcance(e.target.value)}
          placeholder="Alcance"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
        <input
          type="number"
          min={0}
          value={cliques}
          onChange={(e) => setCliques(e.target.value)}
          placeholder="Cliques"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={resultados}
          onChange={(e) => setResultados(e.target.value)}
          placeholder="Resultados (leads/vendas)"
          className="col-span-2 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        placeholder="Observações (opcional)"
        className="mb-2 w-full rounded-xl border border-border bg-base/60 px-3 py-2 text-sm text-text outline-none placeholder:text-muted/50"
      />
      <div className="mb-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
          <Trophy size={11} /> Fechamento do mês (opcional)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={planosFechados}
            onChange={(e) => setPlanosFechados(e.target.value)}
            placeholder="Planos fechados"
            className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
          />
          <CurrencyInput value={valorRetorno} onChange={setValorRetorno} placeholder="Retorno gerado" />
        </div>
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="h-9 w-full rounded-xl bg-accent text-xs font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Salvar resultado"}
      </button>
    </form>
  );
}

function EditarResultadoForm({
  resultado,
  onFechar,
}: {
  resultado: Resultado;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [verbaInvestida, setVerbaInvestida] = useState(resultado.verbaInvestida || 0);
  const [impressoes, setImpressoes] = useState(resultado.impressoes?.toString() || "");
  const [alcance, setAlcance] = useState(resultado.alcance?.toString() || "");
  const [cliques, setCliques] = useState(resultado.cliques?.toString() || "");
  const [resultados, setResultados] = useState(resultado.resultados?.toString() || "");
  const [observacoes, setObservacoes] = useState(resultado.observacoes || "");
  const [planosFechados, setPlanosFechados] = useState(resultado.planosFechados?.toString() || "");
  const [valorRetorno, setValorRetorno] = useState(resultado.valorRetorno || 0);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setEnviando(true);
    await fetch(`/api/resultados-campanha/${resultado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verbaInvestida: verbaInvestida || null,
        impressoes: numOuNulo(impressoes),
        alcance: numOuNulo(alcance),
        cliques: numOuNulo(cliques),
        resultados: numOuNulo(resultados),
        observacoes: observacoes || null,
        planosFechados: numOuNulo(planosFechados),
        valorRetorno: valorRetorno || null,
      }),
    });
    setEnviando(false);
    onFechar();
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir esse registro de resultado?")) return;
    setEnviando(true);
    await fetch(`/api/resultados-campanha/${resultado.id}`, { method: "DELETE" });
    setEnviando(false);
    onFechar();
    router.refresh();
  }

  return (
    <div className="mt-2 rounded-xl border border-accent/30 bg-base/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-text">Editar resultado</p>
        <button onClick={onFechar} className="text-muted hover:text-text">
          <X size={14} />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <CurrencyInput value={verbaInvestida} onChange={setVerbaInvestida} placeholder="Verba investida" />
        <input
          type="number"
          min={0}
          value={impressoes}
          onChange={(e) => setImpressoes(e.target.value)}
          placeholder="Impressões"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={alcance}
          onChange={(e) => setAlcance(e.target.value)}
          placeholder="Alcance"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
        <input
          type="number"
          min={0}
          value={cliques}
          onChange={(e) => setCliques(e.target.value)}
          placeholder="Cliques"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <input
          type="number"
          min={0}
          value={resultados}
          onChange={(e) => setResultados(e.target.value)}
          placeholder="Resultados"
          className="col-span-2 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        placeholder="Observações (opcional)"
        className="mb-2 w-full rounded-xl border border-border bg-base/60 px-3 py-2 text-sm text-text outline-none placeholder:text-muted/50"
      />
      <div className="mb-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
          <Trophy size={11} /> Fechamento do mês (opcional)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={planosFechados}
            onChange={(e) => setPlanosFechados(e.target.value)}
            placeholder="Planos fechados"
            className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
          />
          <CurrencyInput value={valorRetorno} onChange={setValorRetorno} placeholder="Retorno gerado" />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={excluir}
          disabled={enviando}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
        >
          <Trash2 size={13} />
        </button>
        <button
          onClick={salvar}
          disabled={enviando}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-xs font-semibold text-white disabled:opacity-40"
        >
          <Check size={13} /> {enviando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function LinhaResultado({ resultado }: { resultado: Resultado }) {
  const [editando, setEditando] = useState(false);
  const ctr =
    resultado.impressoes && resultado.impressoes > 0 && resultado.cliques
      ? ((resultado.cliques / resultado.impressoes) * 100).toFixed(2)
      : null;
  const custoPorResultado =
    resultado.resultados && resultado.resultados > 0 && resultado.verbaInvestida
      ? resultado.verbaInvestida / resultado.resultados
      : null;

  if (editando) {
    return <EditarResultadoForm resultado={resultado} onFechar={() => setEditando(false)} />;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-base/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-text">
          Período do relatório: {formatarDataRelatorio(resultado.inicio)} – {formatarDataRelatorio(resultado.fim)}
        </p>
        <p className="text-[11px] text-muted">
          {resultado.verbaInvestida != null && `${fmtMoedaCompacta(resultado.verbaInvestida)} investido`}
          {resultado.impressoes != null && ` · ${fmt(resultado.impressoes)} impressões`}
          {resultado.cliques != null && ` · ${fmt(resultado.cliques)} cliques`}
          {ctr && ` (CTR ${ctr}%)`}
          {resultado.alcance != null && ` · ${fmt(resultado.alcance)} alcance`}
          {resultado.resultados != null && ` · ${fmt(resultado.resultados)} resultados`}
          {custoPorResultado && ` · R$ ${custoPorResultado.toFixed(2)}/resultado`}
          {resultado.origem === "meta_import" && " · importado do Meta"}
        </p>
        {resultado.indicadorResultado && (
          <p className="mt-0.5 text-[11px] text-muted/70">Resultado: {labelIndicador(resultado.indicadorResultado)}</p>
        )}
        {resultado.observacoes && <p className="mt-0.5 text-[11px] text-muted/70">{resultado.observacoes}</p>}
        {(resultado.planosFechados != null || resultado.valorRetorno != null) && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-400">
            <Trophy size={10} />
            {resultado.planosFechados != null &&
              `${fmt(resultado.planosFechados)} ${resultado.planosFechados === 1 ? "plano fechado" : "planos fechados"}`}
            {resultado.planosFechados != null && resultado.valorRetorno != null && " · "}
            {resultado.valorRetorno != null && `R$ ${fmt(resultado.valorRetorno)} de retorno`}
          </p>
        )}
      </div>
      <button
        onClick={() => setEditando(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
      >
        <Pencil size={11} />
      </button>
    </div>
  );
}

function Estatistica({
  Icon,
  cor,
  label,
  valor,
  sub,
  index,
}: {
  Icon: any;
  cor: string;
  label: string;
  valor: string;
  sub?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="rounded-xl border border-border bg-base/40 p-3"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={11} style={{ color: cor }} />
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="text-lg font-semibold text-text">{valor}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted">{sub}</p>}
    </motion.div>
  );
}

function PainelResultados({ resultados }: { resultados: Resultado[] }) {
  const meses = Array.from(new Set(resultados.map((r) => r.fim.slice(0, 7)))).sort().reverse();
  const [mes, setMes] = useState(meses[0] || "");
  const mesSelecionado = meses.includes(mes) ? mes : meses[0];
  const doMes = resultados.filter((r) => r.fim.slice(0, 7) === mesSelecionado);
  const contados = agruparPorMes(doMes);
  const mensal = contados.find(ehAcumuladoMensal);
  const ultimoDia = mensal ? new Date(Date.UTC(new Date(mensal.fim).getUTCFullYear(), new Date(mensal.fim).getUTCMonth() + 1, 0)).getUTCDate() : null;
  const fechado = mensal && new Date(mensal.fim).getUTCDate() === ultimoDia;
  const evolucao = marcosAcumuladosMensais(doMes);
  const dados = evolucao.map((r) => ({
    data: r.fim,
    gasto: Number(r.verbaInvestida || 0),
    impressoes: r.impressoes,
    alcance: r.alcance,
    resultados: r.resultados,
    resultadosPorIndicador: r.resultados == null ? [] : [{ indicador: r.indicadorResultado || "(sem indicador)", label: labelIndicador(r.indicadorResultado), total: r.resultados }],
  }));

  const {
    totalInvestido,
    totalResultados,
    totalImpressoes,
    totalAlcance,
    custoPorResultado,
    totalPlanosFechados,
    totalRetorno,
    roi,
    alcanceComparavel,
    resultadosComparaveis,
  } = totalizarResultados(doMes);
  // Frequência = quantas vezes, em média, a mesma pessoa viu o anúncio — sinal de fadiga
  // de criativo quando fica alta demais (referência de mercado: >2-3 em prospecção,
  // >5-7 em remarketing pede troca de criativo ou pausa).
  const frequencia = alcanceComparavel && totalAlcance > 0 ? totalImpressoes / totalAlcance : null;
  // CPM = custo a cada mil impressões — mostra se o leilão do Meta pra esse público/período
  // está caro ou barato, independente de quantos resultados saíram disso.
  const cpm = totalImpressoes > 0 ? (totalInvestido / totalImpressoes) * 1000 : null;

  const retornoSub =
    totalPlanosFechados > 0 && roi != null
      ? `${totalPlanosFechados} ${totalPlanosFechados === 1 ? "plano" : "planos"} · ${roi.toFixed(1)}x`
      : totalPlanosFechados > 0
      ? `${totalPlanosFechados} ${totalPlanosFechados === 1 ? "plano" : "planos"}`
      : roi != null
      ? `${roi.toFixed(1)}x o investido`
      : undefined;

  return (
    <div className="mt-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted">
          {mensal ? <>
            <p className="font-medium text-text">{fechado ? "Fechamento do mês" : "Acumulado do mês"} · {formatarDataRelatorio(mensal.inicio)} – {formatarDataRelatorio(mensal.fim)}</p>
            <p>O total usa o relatório mais atualizado; os anteriores ficam como marcos no gráfico. O período não indica quantos dias a campanha rodou.</p>
          </> : <p>Dados disponíveis no mês. Importe um relatório do dia 1 até a data desejada para atualizar o acumulado.</p>}
        </div>
        <select aria-label="Mês dos resultados" value={mesSelecionado} onChange={(e) => setMes(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text">
          {meses.map((m) => <option key={m} value={m}>{formatarDataRelatorio(`${m}-01T00:00:00Z`, { month: "long", year: "numeric" })}</option>)}
        </select>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <Estatistica Icon={DollarSign} cor={COR_CUSTO} label="Investido" valor={fmtMoedaCompacta(totalInvestido)} index={0} />
        <Estatistica Icon={Target} cor={COR_RESULTADOS} label="Resultados" valor={resultadosComparaveis ? fmt(totalResultados) : "Tipos diferentes"} index={1} />
        <Estatistica
          Icon={Percent}
          cor="#9CA3AF"
          label="Custo/resultado"
          valor={custoPorResultado != null ? fmtMoedaCompacta(custoPorResultado) : "—"}
          index={2}
        />
        <Estatistica Icon={Eye} cor="#9CA3AF" label="Impressões" valor={fmt(totalImpressoes)} index={3} />
        <Estatistica
          Icon={Users}
          cor="#9CA3AF"
          label="Alcance"
          valor={alcanceComparavel && totalAlcance > 0 ? fmt(totalAlcance) : "—"}
          index={4}
        />
        <Estatistica
          Icon={Repeat}
          cor="#9CA3AF"
          label="Frequência"
          valor={frequencia != null ? `${frequencia.toFixed(1)}x` : "—"}
          index={5}
        />
        <Estatistica
          Icon={Coins}
          cor="#9CA3AF"
          label="CPM"
          valor={cpm != null ? fmtMoedaCompacta(cpm) : "—"}
          index={6}
        />
        <Estatistica
          Icon={Trophy}
          cor={COR_RETORNO}
          label="Retorno"
          valor={totalRetorno > 0 ? fmtMoedaCompacta(totalRetorno) : "—"}
          sub={retornoSub}
          index={7}
        />
      </div>

      <EvolucaoImportacoes marcos={dados} />
    </div>
  );
}

export default function ResultadosCampanha({ campanhaId }: { campanhaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [formAberto, setFormAberto] = useState(false);

  async function abrir() {
    if (aberto) {
      setAberto(false);
      return;
    }
    setAberto(true);
    if (resultados === null) {
      setCarregando(true);
      const resp = await fetch(`/api/campanhas/${campanhaId}/resultados`);
      const dados = resp.ok ? await resp.json() : [];
      setResultados(dados);
      setCarregando(false);
    }
  }

  async function recarregar() {
    const resp = await fetch(`/api/campanhas/${campanhaId}/resultados`);
    const dados = resp.ok ? await resp.json() : [];
    setResultados(dados);
  }

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button
        onClick={abrir}
        className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text"
      >
        <TrendingUp size={12} />
        Resultados
        {aberto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {aberto && (
        <div>
          {carregando && <p className="mt-2 text-xs text-muted">Carregando...</p>}

          {!carregando && resultados && resultados.length === 0 && !formAberto && (
            <p className="mt-2 text-xs text-muted">Nenhum resultado lançado ainda pra essa campanha.</p>
          )}

          {!carregando && resultados && resultados.length > 0 && <PainelResultados resultados={resultados} />}

          {!carregando && resultados && resultados.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted">Ver todo o histórico de importações e lançamentos ({resultados.length})</summary>
              <p className="mt-2 text-[11px] text-muted">Relatórios de períodos sobrepostos ficam no histórico e não são somados ao acumulado atual.</p>
              {resultados.map((r) => <LinhaResultado key={r.id} resultado={r} />)}
            </details>
          )}

          {!carregando && (
            <button
              onClick={() => setFormAberto((v) => !v)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-accent/30 bg-accent/5 py-2 text-xs font-medium text-accent hover:bg-accent/10"
            >
              <Plus size={12} /> Lançar resultado
            </button>
          )}
          {formAberto && (
            <NovoResultadoForm
              campanhaId={campanhaId}
              onSalvo={() => {
                setFormAberto(false);
                recarregar();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
