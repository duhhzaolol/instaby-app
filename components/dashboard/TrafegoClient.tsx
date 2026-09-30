"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Check, Trash2, Megaphone, Search } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card } from "@/components/ui/Card";
import ResultadosCampanha from "@/components/dashboard/ResultadosCampanha";
import ImportarCampanhasMeta from "@/components/dashboard/ImportarCampanhasMeta";
import {
  STATUS_INTERNO,
  STATUS_INTERNO_LABEL,
  AVALIACAO,
  AVALIACAO_LABEL,
  formatarNumeroOuNaoInformado,
} from "@/lib/trafego";

type Cliente = { id: string; nome: string; cor: string | null };

type GrupoResultado = { indicador: string; label: string; total: number; qtdCampanhas: number };

type SnapshotView = {
  gasto: number;
  impressoes: number | null;
  alcance: number | null;
  resultadosPorIndicador: GrupoResultado[];
  dataAtualizacao: string | null;
  temDados: boolean;
};

type Campanha = {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCor: string | null;
  nome: string;
  plataforma: string;
  objetivo: string | null;
  verbaMensal: number;
  statusInterno: string;
  ultimoStatusMeta: string | null;
  avaliacao: string;
  avaliacaoObjetivo: string | null;
  avaliacaoMeta: string | null;
  avaliacaoObservacoes: string | null;
  avaliadoPorNome: string | null;
  dataInicio: string;
  dataFim: string | null;
  observacoes: string | null;
  // Orçamento do conjunto de anúncios (spec §2: "separe... orçamento diário da
  // campanha") — só informativo, vindo da última importação do Meta; não é a
  // verbaMensal (meta definida pela agência) nem a verba/saldo do cliente.
  orcamentoConjunto: number | null;
  tipoOrcamento: string | null;
  snapshot: SnapshotView;
};

const PLATAFORMAS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  outro: "Outra",
};

const OBJETIVOS: Record<string, string> = {
  conversao: "Conversão",
  alcance: "Alcance",
  trafego: "Tráfego",
  engajamento: "Engajamento",
  leads: "Geração de leads",
  vendas: "Vendas",
  outro: "Outro",
};

// Cores só de exibição (mapeamento visual, não lógica de negócio — essa fica em
// lib/trafego.ts). Em acompanhamento usa o mesmo verde-azulado de "resultado" no
// resto do módulo; pausada usa o âmbar já usado pra esse sentido no app inteiro.
const STATUS_INTERNO_COR: Record<string, string> = {
  em_acompanhamento: "#0D9488",
  pausada: "#F59E0B",
  finalizada: "#9CA3AF",
  arquivada: "#6B7280",
};
const AVALIACAO_COR: Record<string, string> = {
  nao_avaliada: "#9CA3AF",
  dentro_da_meta: "#22C55E",
  abaixo_da_meta: "#E63946",
  inconclusiva: "#F59E0B",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmt2(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dataBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function MiniStat({ label, valor, sub }: { label: string; valor: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-base/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-medium text-text">{valor}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}

// Números "de verdade" da campanha (ledger de importação do Meta) — nunca soma
// resultados de indicadores diferentes entre si (spec §4): cada grupo aparece com seu
// próprio custo/resultado. Fica ACIMA do histórico manual (ResultadosCampanha), que
// continua servindo pra lançamentos de outras plataformas/observações pontuais.
function SnapshotCampanhaBloco({ snapshot }: { snapshot: SnapshotView }) {
  if (!snapshot.temDados) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-border bg-base/20 px-3 py-2 text-[11px] text-muted">
        Sem dados importados do Meta pra essa campanha ainda.
      </p>
    );
  }
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Gasto (Meta)" valor={`R$ ${fmt2(snapshot.gasto)}`} />
        <MiniStat label="Impressões" valor={formatarNumeroOuNaoInformado(snapshot.impressoes)} />
        <MiniStat label="Alcance" valor={formatarNumeroOuNaoInformado(snapshot.alcance)} />
        <MiniStat
          label="Atualizado em"
          valor={snapshot.dataAtualizacao ? dataBr(snapshot.dataAtualizacao) : "—"}
        />
        {snapshot.resultadosPorIndicador.map((r) => (
          <MiniStat
            key={r.indicador}
            label={r.label}
            valor={r.total.toLocaleString("pt-BR")}
            sub={r.total > 0 ? `R$ ${(snapshot.gasto / r.total).toFixed(2)}/resultado` : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function CamposCampanha({
  clientes,
  clienteId,
  setClienteId,
  nome,
  setNome,
  plataforma,
  setPlataforma,
  objetivo,
  setObjetivo,
  verbaMensal,
  setVerbaMensal,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  observacoes,
  setObservacoes,
  travarCliente,
}: {
  clientes: Cliente[];
  clienteId: string;
  setClienteId: (v: string) => void;
  nome: string;
  setNome: (v: string) => void;
  plataforma: string;
  setPlataforma: (v: string) => void;
  objetivo: string;
  setObjetivo: (v: string) => void;
  verbaMensal: number;
  setVerbaMensal: (v: number) => void;
  dataInicio: string;
  setDataInicio: (v: string) => void;
  dataFim: string;
  setDataFim: (v: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
  travarCliente?: boolean;
}) {
  return (
    <>
      {!travarCliente && (
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Selecione o cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      )}

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da campanha (ex: Conversão Setembro)"
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text"
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={plataforma}
          onChange={(e) => setPlataforma(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          {Object.entries(PLATAFORMAS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="">Objetivo (opcional)</option>
          {Object.entries(OBJETIVOS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <CurrencyInput value={verbaMensal} onChange={setVerbaMensal} placeholder="Meta de verba mensal (opcional)" />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <DatePicker value={dataInicio} onChange={setDataInicio} placeholder="Início" />
        <DatePicker value={dataFim} onChange={setDataFim} placeholder="Fim (opcional)" limpavel />
      </div>

      <textarea
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        placeholder="Observações (opcional)"
        className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50 focus:border-accent/50"
      />
    </>
  );
}

function NovaCampanhaForm({
  clientes,
  clienteFixo,
  onSalvo,
}: {
  clientes: Cliente[];
  clienteFixo?: string;
  onSalvo: () => void;
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(clienteFixo || "");
  const [nome, setNome] = useState("");
  const [plataforma, setPlataforma] = useState("meta_ads");
  const [objetivo, setObjetivo] = useState("");
  const [verbaMensal, setVerbaMensal] = useState(0);
  const [dataInicio, setDataInicio] = useState(new Date().toLocaleDateString("en-CA"));
  const [dataFim, setDataFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !nome.trim() || !plataforma) return;
    setEnviando(true);
    // Sem status/statusInterno no corpo — toda campanha nova nasce "em acompanhamento"
    // (default do servidor). Pausar/finalizar/arquivar é uma decisão de depois.
    const res = await fetch("/api/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        nome,
        plataforma,
        objetivo: objetivo || null,
        verbaMensal,
        dataInicio,
        dataFim: dataFim || null,
        observacoes: observacoes || null,
      }),
    });
    setEnviando(false);
    if (!res.ok) {
      alert("Não consegui salvar essa campanha. Tenta de novo.");
      return;
    }
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="mt-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova campanha</p>
        <button type="button" onClick={onSalvo} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <CamposCampanha
        clientes={clientes}
        clienteId={clienteId}
        setClienteId={setClienteId}
        nome={nome}
        setNome={setNome}
        plataforma={plataforma}
        setPlataforma={setPlataforma}
        objetivo={objetivo}
        setObjetivo={setObjetivo}
        verbaMensal={verbaMensal}
        setVerbaMensal={setVerbaMensal}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        observacoes={observacoes}
        setObservacoes={setObservacoes}
        travarCliente={!!clienteFixo}
      />
      <button
        type="submit"
        disabled={enviando || !clienteId || !nome.trim()}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function EditarCampanhaForm({
  campanha,
  clientes,
  onFechar,
}: {
  campanha: Campanha;
  clientes: Cliente[];
  onFechar: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(campanha.nome);
  const [plataforma, setPlataforma] = useState(campanha.plataforma);
  const [objetivo, setObjetivo] = useState(campanha.objetivo || "");
  const [verbaMensal, setVerbaMensal] = useState(campanha.verbaMensal);
  const [dataInicio, setDataInicio] = useState(campanha.dataInicio.slice(0, 10));
  const [dataFim, setDataFim] = useState(campanha.dataFim ? campanha.dataFim.slice(0, 10) : "");
  const [observacoes, setObservacoes] = useState(campanha.observacoes || "");
  const [statusInterno, setStatusInterno] = useState(campanha.statusInterno);
  const [avaliacao, setAvaliacao] = useState(campanha.avaliacao);
  const [avaliacaoObjetivo, setAvaliacaoObjetivo] = useState(campanha.avaliacaoObjetivo || "");
  const [avaliacaoMeta, setAvaliacaoMeta] = useState(campanha.avaliacaoMeta || "");
  const [avaliacaoObservacoes, setAvaliacaoObservacoes] = useState(campanha.avaliacaoObservacoes || "");
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setEnviando(true);
    const res = await fetch(`/api/campanhas/${campanha.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        plataforma,
        objetivo: objetivo || null,
        verbaMensal,
        statusInterno,
        dataInicio,
        dataFim: dataFim || null,
        observacoes: observacoes || null,
        avaliacao,
        avaliacaoObjetivo: avaliacaoObjetivo || null,
        avaliacaoMeta: avaliacaoMeta || null,
        avaliacaoObservacoes: avaliacaoObservacoes || null,
      }),
    });
    setEnviando(false);
    if (!res.ok) {
      alert("Não consegui salvar as alterações dessa campanha. Tenta de novo.");
      return;
    }
    onFechar();
    router.refresh();
  }

  async function excluir() {
    if (!confirm(`Excluir a campanha "${campanha.nome}"? O histórico de importações ligado a ela também será perdido.`)) return;
    setEnviando(true);
    const res = await fetch(`/api/campanhas/${campanha.id}`, { method: "DELETE" });
    setEnviando(false);
    if (!res.ok) {
      alert("Não consegui excluir essa campanha. Tenta de novo.");
      return;
    }
    onFechar();
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Editar campanha</p>
        <button onClick={onFechar} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <CamposCampanha
        clientes={clientes}
        clienteId={campanha.clienteId}
        setClienteId={() => {}}
        nome={nome}
        setNome={setNome}
        plataforma={plataforma}
        setPlataforma={setPlataforma}
        objetivo={objetivo}
        setObjetivo={setObjetivo}
        verbaMensal={verbaMensal}
        setVerbaMensal={setVerbaMensal}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        observacoes={observacoes}
        setObservacoes={setObservacoes}
        travarCliente
      />

      <div className="mb-3 rounded-xl border border-border bg-base/40 p-3">
        <p className="mb-1.5 text-xs font-medium text-text">Status interno (organização sua)</p>
        <select
          value={statusInterno}
          onChange={(e) => setStatusInterno(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
        >
          {STATUS_INTERNO.map((s) => (
            <option key={s} value={s}>
              {STATUS_INTERNO_LABEL[s]}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] text-muted">
          Isso é só organização sua — não liga nem desliga nada na Meta, e uma campanha finalizada ou arquivada
          aqui não significa que ela fracassou.
          {campanha.ultimoStatusMeta && ` Status importado da Meta (informativo): ${campanha.ultimoStatusMeta}.`}
        </p>
      </div>

      <div className="mb-3 rounded-xl border border-border bg-base/40 p-3">
        <p className="mb-1.5 text-xs font-medium text-text">Avaliação</p>
        <select
          value={avaliacao}
          onChange={(e) => setAvaliacao(e.target.value)}
          className="mb-2 h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
        >
          {AVALIACAO.map((a) => (
            <option key={a} value={a}>
              {AVALIACAO_LABEL[a]}
            </option>
          ))}
        </select>
        <input
          value={avaliacaoObjetivo}
          onChange={(e) => setAvaliacaoObjetivo(e.target.value)}
          placeholder="Objetivo dessa avaliação (ex: gerar conversas pro time comercial)"
          className="mb-2 h-9 w-full rounded-lg border border-border bg-card/60 px-2.5 text-xs text-text placeholder:text-muted/50"
        />
        <input
          value={avaliacaoMeta}
          onChange={(e) => setAvaliacaoMeta(e.target.value)}
          placeholder="Meta (ex: R$ 15/resultado, ou 100 conversas/mês)"
          className="mb-2 h-9 w-full rounded-lg border border-border bg-card/60 px-2.5 text-xs text-text placeholder:text-muted/50"
        />
        <textarea
          value={avaliacaoObservacoes}
          onChange={(e) => setAvaliacaoObservacoes(e.target.value)}
          rows={2}
          placeholder="Observações da avaliação (opcional)"
          className="w-full rounded-lg border border-border bg-card/60 px-2.5 py-2 text-xs text-text outline-none placeholder:text-muted/50"
        />
        {campanha.avaliadoPorNome && (
          <p className="mt-1.5 text-[11px] text-muted">Última avaliação por {campanha.avaliadoPorNome}.</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={excluir}
          disabled={enviando}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={salvar}
          disabled={enviando || !nome.trim()}
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
        >
          <Check size={14} /> {enviando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

export default function TrafegoClient({
  campanhas,
  clientes,
  clienteFixo,
  contexto = "tudo",
}: {
  campanhas: Campanha[];
  clientes: Cliente[];
  clienteFixo?: string;
  // "ativas" (tela Campanhas — já vem filtrada pra não-finalizada/arquivada),
  // "finalizadas" (tela Finalizadas — já vem filtrada pra finalizada/arquivada) ou
  // "tudo" (aba Tráfego Pago dentro do próprio cliente, sem filtro de status).
  contexto?: "ativas" | "finalizadas" | "tudo";
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroClienteId, setFiltroClienteId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const mostrarCriacao = contexto !== "finalizadas";
  const textoVazio =
    contexto === "finalizadas"
      ? "Nenhuma campanha finalizada ou arquivada ainda."
      : contexto === "ativas"
      ? "Nenhuma campanha em acompanhamento no momento."
      : "Nenhuma campanha cadastrada ainda.";

  const campanhasFiltradas = campanhas.filter((c) => {
    if (filtroClienteId && c.clienteId !== filtroClienteId) return false;
    if (filtroStatus && c.statusInterno !== filtroStatus) return false;
    if (busca.trim() && !c.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {mostrarCriacao && <ImportarCampanhasMeta clientes={clientes} clienteFixo={clienteFixo} />}

      {mostrarCriacao && (
        <div className="mb-4">
          <button
            onClick={() => setFormAberto((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
          >
            <Plus size={15} /> Nova campanha
          </button>
          {formAberto && (
            <NovaCampanhaForm clientes={clientes} clienteFixo={clienteFixo} onSalvo={() => setFormAberto(false)} />
          )}
        </div>
      )}

      {campanhas.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="h-9 w-full rounded-lg border border-border bg-base/60 pl-8 pr-3 text-xs text-text placeholder:text-muted/60"
            />
          </div>
          {!clienteFixo && clientes.length > 1 && (
            <select
              value={filtroClienteId}
              onChange={(e) => setFiltroClienteId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
            >
              <option value="">Todos os clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
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
        </div>
      )}

      <div className="flex flex-col gap-2">
        {campanhas.length === 0 && (
          <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">{textoVazio}</p>
        )}
        {campanhas.length > 0 && campanhasFiltradas.length === 0 && (
          <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
            Nenhuma campanha encontrada com esse filtro.
          </p>
        )}
        {campanhasFiltradas.map((c, i) =>
          editandoId === c.id ? (
            <EditarCampanhaForm key={c.id} campanha={c} clientes={clientes} onFechar={() => setEditandoId(null)} />
          ) : (
            <Card key={c.id} index={i} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Megaphone size={14} className="shrink-0 text-accent" />
                    <p className="truncate text-sm font-medium text-text">{c.nome}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${STATUS_INTERNO_COR[c.statusInterno]}1A`, color: STATUS_INTERNO_COR[c.statusInterno] }}
                    >
                      {STATUS_INTERNO_LABEL[c.statusInterno] || c.statusInterno}
                    </span>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      style={{ borderColor: `${AVALIACAO_COR[c.avaliacao]}40`, color: AVALIACAO_COR[c.avaliacao] }}
                    >
                      {AVALIACAO_LABEL[c.avaliacao] || c.avaliacao}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {!clienteFixo && (
                      <>
                        <span style={{ color: c.clienteCor || undefined }}>{c.clienteNome}</span> ·{" "}
                      </>
                    )}
                    {PLATAFORMAS[c.plataforma] || c.plataforma}
                    {c.objetivo && ` · ${OBJETIVOS[c.objetivo] || c.objetivo}`} · desde {dataBr(c.dataInicio)}
                    {c.dataFim && ` até ${dataBr(c.dataFim)}`}
                    {c.ultimoStatusMeta && ` · Meta: ${c.ultimoStatusMeta}`}
                  </p>
                  {c.verbaMensal > 0 && (
                    <p className="mt-0.5 text-xs text-muted">
                      <span className="text-muted/70">Meta de verba:</span> R$ {fmt(c.verbaMensal)}/mês
                    </p>
                  )}
                  {c.orcamentoConjunto != null && (
                    <p className="mt-0.5 text-xs text-muted">
                      <span className="text-muted/70">Orçamento do conjunto (Meta):</span> R$ {fmt2(c.orcamentoConjunto)}
                      {c.tipoOrcamento && ` · ${c.tipoOrcamento}`}
                    </p>
                  )}
                  {c.avaliacaoMeta && (
                    <p className="mt-1 text-xs text-muted">
                      <span className="text-muted/70">Meta de avaliação:</span> {c.avaliacaoMeta}
                    </p>
                  )}
                  {c.avaliacaoObservacoes && <p className="mt-0.5 text-xs text-muted/70">{c.avaliacaoObservacoes}</p>}
                  {c.observacoes && <p className="mt-0.5 text-xs text-muted/70">{c.observacoes}</p>}
                </div>
                <button
                  onClick={() => setEditandoId(c.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
                >
                  <Pencil size={13} />
                </button>
              </div>

              <SnapshotCampanhaBloco snapshot={c.snapshot} />

              <ResultadosCampanha campanhaId={c.id} />
            </Card>
          )
        )}
      </div>
    </div>
  );
}
