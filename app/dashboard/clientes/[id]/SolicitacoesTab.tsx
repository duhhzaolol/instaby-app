"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, AlertCircle } from "lucide-react";
import { AjudaContextual } from "@/components/ui/AjudaContextual";

export type SolicitacaoData = {
  id: string;
  descricao: string;
  prioridade: string;
  status: string;
  extra: boolean;
  createdAt: string;
};

const CORES_PRIORIDADE: Record<string, string> = { alta: "#EF4444", media: "#F59E0B", baixa: "#9CA3AF" };

export default function SolicitacoesTab({ clienteId, solicitacoes }: { clienteId: string; solicitacoes: SolicitacaoData[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [extra, setExtra] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setEnviando(true);
    await fetch(`/api/clientes/${clienteId}/solicitacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, prioridade, extra }),
    });
    setEnviando(false);
    setDescricao("");
    setPrioridade("media");
    setExtra(false);
    setAberto(false);
    router.refresh();
  }

  async function mudarStatus(id: string, status: string) {
    await fetch(`/api/solicitacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir essa solicitação?")) return;
    await fetch(`/api/solicitacoes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const abertas = solicitacoes.filter((s) => s.status !== "concluida");
  const concluidas = solicitacoes.filter((s) => s.status === "concluida");

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <p className="text-sm font-medium text-text">Solicitações do cliente</p>
        <AjudaContextual
          titulo="Solicitações"
          texto="Pedidos que o cliente fez (via WhatsApp, reunião etc.) e que você quer não esquecer. Marque como extra quando for algo fora do escopo combinado."
          exemplo="Ex.: registre 'Trocar a foto de capa do Instagram' com prioridade alta."
        />
      </div>
      <div className="mb-4 flex flex-col gap-2">
        {abertas.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card/60 p-3.5">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <p className="text-sm text-text">{s.descricao}</p>
              <button onClick={() => excluir(s.id)} className="shrink-0 text-muted hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: `${CORES_PRIORIDADE[s.prioridade]}1A`, color: CORES_PRIORIDADE[s.prioridade] }}>
                {s.prioridade === "alta" ? "Alta" : s.prioridade === "media" ? "Média" : "Baixa"}
              </span>
              {s.extra && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                  <AlertCircle size={10} /> Fora do escopo
                </span>
              )}
              <select
                value={s.status}
                onChange={(e) => mudarStatus(s.id, e.target.value)}
                className="ml-auto h-6 rounded-lg border border-border bg-base px-1.5 text-[10px] text-muted"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>
        ))}
        {abertas.length === 0 && <p className="text-sm text-muted">Nenhuma solicitação em aberto.</p>}
      </div>

      {concluidas.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer text-xs text-muted">{concluidas.length} concluída(s)</summary>
          <div className="mt-2 flex flex-col gap-1.5">
            {concluidas.map((s) => (
              <p key={s.id} className="text-xs text-muted line-through">
                {s.descricao}
              </p>
            ))}
          </div>
        </details>
      )}

      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text"
        >
          <Plus size={15} /> Registrar solicitação
        </button>
      ) : (
        <form onSubmit={salvar} className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text">Nova solicitação</p>
            <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
              <X size={16} />
            </button>
          </div>
          <textarea
            autoFocus
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            placeholder="O que o cliente pediu?"
            className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text"
          />
          <div className="mb-3 flex items-center gap-3">
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="h-9 rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-text">
              <input type="checkbox" checked={extra} onChange={(e) => setExtra(e.target.checked)} />
              Fora do escopo (pode precisar orçamento extra)
            </label>
          </div>
          <button
            type="submit"
            disabled={enviando || !descricao.trim()}
            className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
          >
            {enviando ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}
    </div>
  );
}
