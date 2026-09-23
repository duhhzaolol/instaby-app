"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Check, Trash2, Megaphone } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card } from "@/components/ui/Card";
import ResultadosCampanha from "@/components/dashboard/ResultadosCampanha";

type Cliente = { id: string; nome: string; cor: string | null };

type Campanha = {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCor: string | null;
  nome: string;
  plataforma: string;
  objetivo: string | null;
  verbaMensal: number;
  status: string;
  dataInicio: string;
  dataFim: string | null;
  observacoes: string | null;
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

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
  status,
  setStatus,
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
  status: string;
  setStatus: (v: string) => void;
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

      <div className="mb-3 grid grid-cols-2 gap-2">
        <CurrencyInput value={verbaMensal} onChange={setVerbaMensal} placeholder="Verba mensal" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
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
  const [status, setStatus] = useState("ativa");
  const [dataInicio, setDataInicio] = useState(new Date().toLocaleDateString("en-CA"));
  const [dataFim, setDataFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !nome.trim() || !plataforma) return;
    setEnviando(true);
    await fetch("/api/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        nome,
        plataforma,
        objetivo: objetivo || null,
        verbaMensal,
        status,
        dataInicio,
        dataFim: dataFim || null,
        observacoes: observacoes || null,
      }),
    });
    setEnviando(false);
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
        status={status}
        setStatus={setStatus}
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
  const [status, setStatus] = useState(campanha.status);
  const [dataInicio, setDataInicio] = useState(campanha.dataInicio.slice(0, 10));
  const [dataFim, setDataFim] = useState(campanha.dataFim ? campanha.dataFim.slice(0, 10) : "");
  const [observacoes, setObservacoes] = useState(campanha.observacoes || "");
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setEnviando(true);
    await fetch(`/api/campanhas/${campanha.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        plataforma,
        objetivo: objetivo || null,
        verbaMensal,
        status,
        dataInicio,
        dataFim: dataFim || null,
        observacoes: observacoes || null,
      }),
    });
    setEnviando(false);
    onFechar();
    router.refresh();
  }

  async function excluir() {
    if (!confirm(`Excluir a campanha "${campanha.nome}"?`)) return;
    setEnviando(true);
    await fetch(`/api/campanhas/${campanha.id}`, { method: "DELETE" });
    setEnviando(false);
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
        status={status}
        setStatus={setStatus}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        observacoes={observacoes}
        setObservacoes={setObservacoes}
        travarCliente
      />
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
}: {
  campanhas: Campanha[];
  clientes: Cliente[];
  clienteFixo?: string;
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div>
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

      <div className="flex flex-col gap-2">
        {campanhas.length === 0 && (
          <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
            Nenhuma campanha cadastrada ainda.
          </p>
        )}
        {campanhas.map((c, i) =>
          editandoId === c.id ? (
            <EditarCampanhaForm key={c.id} campanha={c} clientes={clientes} onFechar={() => setEditandoId(null)} />
          ) : (
            <Card key={c.id} index={i} className={`p-4 ${c.status !== "ativa" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Megaphone size={14} className="shrink-0 text-accent" />
                    <p className="truncate text-sm font-medium text-text">{c.nome}</p>
                  </div>
                  <p className="text-xs text-muted">
                    {!clienteFixo && (
                      <>
                        <span style={{ color: c.clienteCor || undefined }}>{c.clienteNome}</span> ·{" "}
                      </>
                    )}
                    {PLATAFORMAS[c.plataforma] || c.plataforma}
                    {c.objetivo && ` · ${OBJETIVOS[c.objetivo] || c.objetivo}`} · desde{" "}
                    {new Date(c.dataInicio).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    {c.dataFim && ` até ${new Date(c.dataFim).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`}
                  </p>
                  {c.observacoes && <p className="mt-1 text-xs text-muted/70">{c.observacoes}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-text">R$ {fmt(c.verbaMensal)}/mês</p>
                    <p
                      className={`text-[11px] ${
                        c.status === "ativa" ? "text-emerald-400" : c.status === "pausada" ? "text-amber-400" : "text-muted"
                      }`}
                    >
                      {STATUS_LABEL[c.status] || c.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditandoId(c.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
              <ResultadosCampanha campanhaId={c.id} />
            </Card>
          )
        )}
      </div>
    </div>
  );
}
