"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Check, Gem } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Card } from "@/components/ui/Card";

type Bem = {
  id: string;
  nome: string;
  categoria: string | null;
  valorAquisicao: number;
  valorAtual: number;
  data: string;
  status: string;
  origem: string | null;
};

const CATEGORIAS_PATRIMONIO = ["Equipamento audiovisual", "Computador", "Móveis", "Software", "Outros"];

const STATUS_LABEL: Record<string, string> = {
  em_uso: "Em uso",
  vendido: "Vendido",
  baixado: "Baixado",
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function NovoBemForm({ onSalvo }: { onSalvo: () => void }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_PATRIMONIO[0]);
  const [valorAquisicao, setValorAquisicao] = useState(0);
  // Data local do navegador (não UTC) — depois das 21h (horário de Brasília),
  // toISOString() já cai no dia seguinte e o formulário abria com a data errada.
  const [data, setData] = useState(new Date().toLocaleDateString("en-CA"));
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || valorAquisicao <= 0) return;
    setEnviando(true);
    await fetch("/api/patrimonio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, categoria, valorAquisicao, data }),
    });
    setEnviando(false);
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="mt-3 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Novo bem</p>
        <button type="button" onClick={onSalvo} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <input
        autoFocus
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="ex: Sony ZV-E10 II"
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text"
      />
      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          {CATEGORIAS_PATRIMONIO.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <div className="mb-4">
        <CurrencyInput value={valorAquisicao} onChange={setValorAquisicao} placeholder="Valor de aquisição" />
      </div>
      <button
        type="submit"
        disabled={enviando || !nome.trim() || valorAquisicao <= 0}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function EditarBemForm({ bem, onFechar }: { bem: Bem; onFechar: () => void }) {
  const router = useRouter();
  const [valorAtual, setValorAtual] = useState(bem.valorAtual);
  const [status, setStatus] = useState(bem.status);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setEnviando(true);
    await fetch(`/api/patrimonio/${bem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valorAtual, status }),
    });
    setEnviando(false);
    onFechar();
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">{bem.nome}</p>
        <button onClick={onFechar} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] text-muted">Valor atual estimado</label>
          <CurrencyInput value={valorAtual} onChange={setValorAtual} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-muted">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
          >
            <option value="em_uso">Em uso</option>
            <option value="vendido">Vendido</option>
            <option value="baixado">Baixado</option>
          </select>
        </div>
      </div>
      <button
        onClick={salvar}
        disabled={enviando}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        <Check size={14} /> {enviando ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

export default function PatrimonioClient({
  bens,
  totalAtual,
  totalAquisicao,
}: {
  bens: Bem[];
  totalAtual: number;
  totalAquisicao: number;
}) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card index={0} className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <Gem size={13} className="text-violet-400" /> Valor atual estimado (em uso)
          </p>
          <p className="text-2xl font-medium text-text">R$ {fmt(totalAtual)}</p>
        </Card>
        <Card index={1} className="p-4">
          <p className="mb-2 text-xs text-muted">Total investido em aquisições</p>
          <p className="text-2xl font-medium text-text">R$ {fmt(totalAquisicao)}</p>
        </Card>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setFormAberto((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
        >
          <Plus size={15} /> Cadastrar bem manualmente
        </button>
        {formAberto && <NovoBemForm onSalvo={() => setFormAberto(false)} />}
      </div>

      <div className="flex flex-col gap-2">
        {bens.length === 0 && (
          <p className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted">
            Nenhum bem cadastrado ainda. Cadastre manualmente ou marque "Adicionar ao patrimônio" ao lançar uma
            despesa como Investimento/Ativo.
          </p>
        )}
        {bens.map((b) =>
          editandoId === b.id ? (
            <EditarBemForm key={b.id} bem={b} onFechar={() => setEditandoId(null)} />
          ) : (
            <div
              key={b.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 ${
                b.status !== "em_uso" ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{b.nome}</p>
                <p className="text-xs text-muted">
                  {b.categoria || "Sem categoria"} · adquirido em {new Date(b.data).toLocaleDateString("pt-BR")}
                  {b.origem ? ` · via despesa "${b.origem}"` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-text">R$ {fmt(b.valorAtual)}</p>
                  <p className="text-[11px] text-muted">
                    aquisição R$ {fmt(b.valorAquisicao)} ·{" "}
                    <span
                      className={
                        b.status === "em_uso" ? "text-emerald-400" : b.status === "vendido" ? "text-cyan-400" : "text-muted"
                      }
                    >
                      {STATUS_LABEL[b.status] || b.status}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setEditandoId(b.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
