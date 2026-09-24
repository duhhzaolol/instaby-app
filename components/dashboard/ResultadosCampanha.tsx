"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, X, Check, Trash2, Pencil, TrendingUp, DollarSign, Target, Percent, Eye, Trophy } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";

// Cores da mini-visão de tendência — vermelho da marca pra custo (dinheiro saindo),
// verde-azulado pra resultado (o que "entra" de retorno). Validadas com o script de
// contraste/CVD do design system (dataviz skill) contra o fundo do card (#1C2028):
// ΔE 11.6 (deutan), bem acima do alvo de 8 — seguro mesmo lado a lado.
const COR_CUSTO = "#E63946";
const COR_RESULTADOS = "#0D9488";
// Âmbar pro fechamento/retorno — mesma cor já usada em status "pausada" no resto do
// módulo, então não é uma cor nova no vocabulário do app; aqui marca "resultado em R$".
const COR_RETORNO = "#F59E0B";

function compactar(v: number): string {
  const sinal = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sinal}${(abs / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000) return `${sinal}${(abs / 1_000).toFixed(1).replace(".", ",")}K`;
  if (abs >= 10 || Number.isInteger(abs)) return `${sinal}${Math.round(abs).toLocaleString("pt-BR")}`;
  return `${sinal}${abs.toFixed(2).replace(".", ",")}`;
}
function fmtMoedaCompacta(v: number): string {
  return `R$ ${compactar(v)}`;
}

type Resultado = {
  id: string;
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
          value={cliques}
          onChange={(e) => setCliques(e.target.value)}
          placeholder="Cliques"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
        <input
          type="number"
          min={0}
          value={resultados}
          onChange={(e) => setResultados(e.target.value)}
          placeholder="Resultados (leads/vendas)"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
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
          value={cliques}
          onChange={(e) => setCliques(e.target.value)}
          placeholder="Cliques"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
        <input
          type="number"
          min={0}
          value={resultados}
          onChange={(e) => setResultados(e.target.value)}
          placeholder="Resultados"
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
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
          {new Date(resultado.inicio).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })} –{" "}
          {new Date(resultado.fim).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </p>
        <p className="text-[11px] text-muted">
          {resultado.verbaInvestida != null && `R$ ${fmt(resultado.verbaInvestida)} investido`}
          {resultado.impressoes != null && ` · ${fmt(resultado.impressoes)} impressões`}
          {resultado.cliques != null && ` · ${fmt(resultado.cliques)} cliques`}
          {ctr && ` (CTR ${ctr}%)`}
          {resultado.alcance != null && ` · ${fmt(resultado.alcance)} alcance`}
          {resultado.resultados != null && ` · ${fmt(resultado.resultados)} resultados`}
          {custoPorResultado && ` · R$ ${custoPorResultado.toFixed(2)}/resultado`}
          {resultado.origem === "meta_import" && " · importado do Meta"}
        </p>
        {resultado.indicadorResultado && (
          <p className="mt-0.5 text-[11px] text-muted/70">Resultado = {resultado.indicadorResultado}</p>
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

function MiniAreaChart({
  titulo,
  dados,
  dataKey,
  cor,
  formatador,
}: {
  titulo: string;
  dados: { data: string; custo: number | null; resultados: number | null }[];
  dataKey: "custo" | "resultados";
  cor: string;
  formatador: (v: number) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-base/40 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted">
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
        {titulo}
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={dados} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={cor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="data" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} minTickGap={20} />
          <YAxis
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => formatador(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: cor, strokeWidth: 1, strokeOpacity: 0.35 }}
            contentStyle={{
              fontSize: 11,
              borderRadius: 10,
              background: "#1C2028",
              border: "1px solid rgba(255,255,255,.08)",
            }}
            labelStyle={{ color: "#9CA3AF", marginBottom: 2 }}
            formatter={(valor: any) => [formatador(Number(valor)), titulo]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={cor}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            activeDot={{ r: 4, fill: cor, stroke: "#1C2028", strokeWidth: 2 }}
            connectNulls
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Soma sem duplicar exportações "mês corrido": o fluxo real é exportar sempre a partir
// do dia 1 do mês, com data final crescente (1–10, depois 1–20, depois 1–30...) — cada
// exportação nova já inclui as anteriores, então somar todas infla o total. Agrupa por
// mês do início; se o grupo inteiro compartilha o mesmo início, é esse caso — conta só a
// entrada mais recente (maior fim). Se os inícios diferem dentro do mesmo grupo (ex:
// exportação dia a dia, ou lançamentos manuais de períodos pontuais), são períodos de
// fato distintos — soma todos normalmente.
function agruparPorMes(lista: Resultado[]): Resultado[] {
  const porMes = new Map<string, Resultado[]>();
  for (const r of lista) {
    const d = new Date(r.inicio);
    const chave = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const grupo = porMes.get(chave);
    if (grupo) grupo.push(r);
    else porMes.set(chave, [r]);
  }

  const contados: Resultado[] = [];
  for (const grupo of porMes.values()) {
    const iniciosUnicos = new Set(grupo.map((r) => new Date(r.inicio).getTime()));
    if (grupo.length > 1 && iniciosUnicos.size === 1) {
      contados.push(grupo.reduce((a, b) => (new Date(b.fim) > new Date(a.fim) ? b : a)));
    } else {
      contados.push(...grupo);
    }
  }
  return contados;
}

function PainelResultados({ resultados }: { resultados: Resultado[] }) {
  const ordenados = [...resultados].sort((a, b) => new Date(a.fim).getTime() - new Date(b.fim).getTime());
  const dados = ordenados.map((r) => ({
    data: new Date(r.fim).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }),
    custo: r.verbaInvestida != null ? Number(r.verbaInvestida) : null,
    resultados: r.resultados,
  }));

  // Totais usam a lista deduplicada (contados) — o gráfico acima continua no `ordenados`
  // bruto, com todas as entradas, pra manter a curva de progressão do mês funcionando.
  const contados = agruparPorMes(ordenados);
  const totalInvestido = contados.reduce((s, r) => s + (r.verbaInvestida ? Number(r.verbaInvestida) : 0), 0);
  const totalResultados = contados.reduce((s, r) => s + (r.resultados || 0), 0);
  const totalImpressoes = contados.reduce((s, r) => s + (r.impressoes || 0), 0);
  const custoPorResultado = totalResultados > 0 ? totalInvestido / totalResultados : null;

  const totalPlanosFechados = contados.reduce((s, r) => s + (r.planosFechados || 0), 0);
  const totalRetorno = contados.reduce((s, r) => s + (r.valorRetorno ? Number(r.valorRetorno) : 0), 0);
  const roi = totalInvestido > 0 && totalRetorno > 0 ? totalRetorno / totalInvestido : null;
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
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Estatistica Icon={DollarSign} cor={COR_CUSTO} label="Investido" valor={fmtMoedaCompacta(totalInvestido)} index={0} />
        <Estatistica Icon={Target} cor={COR_RESULTADOS} label="Resultados" valor={compactar(totalResultados)} index={1} />
        <Estatistica
          Icon={Percent}
          cor="#9CA3AF"
          label="Custo/resultado"
          valor={custoPorResultado != null ? fmtMoedaCompacta(custoPorResultado) : "—"}
          index={2}
        />
        <Estatistica Icon={Eye} cor="#9CA3AF" label="Impressões" valor={compactar(totalImpressoes)} index={3} />
        <Estatistica
          Icon={Trophy}
          cor={COR_RETORNO}
          label="Retorno"
          valor={totalRetorno > 0 ? fmtMoedaCompacta(totalRetorno) : "—"}
          sub={retornoSub}
          index={4}
        />
      </div>

      {dados.length >= 2 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MiniAreaChart
            titulo="Custo por período"
            dados={dados}
            dataKey="custo"
            cor={COR_CUSTO}
            formatador={fmtMoedaCompacta}
          />
          <MiniAreaChart
            titulo="Resultados por período"
            dados={dados}
            dataKey="resultados"
            cor={COR_RESULTADOS}
            formatador={compactar}
          />
        </div>
      )}
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

          {!carregando &&
            resultados?.map((r) => <LinhaResultado key={r.id} resultado={r} />)}

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
