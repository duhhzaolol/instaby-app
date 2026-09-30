"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, AlertCircle, Link2, MessageSquareText, Paperclip, ListChecks, ClipboardCheck, Receipt } from "lucide-react";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { DatePicker } from "@/components/ui/DatePicker";
import { CATEGORIAS_TAREFA, visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { perguntasParaCategoria } from "@/lib/solicitacoes";

export type SolicitacaoData = {
  id: string;
  descricao: string;
  prioridade: string;
  status: string;
  extra: boolean;
  createdAt: string;
  // Etapa 3 (v157) — formulário de solicitação do cliente.
  origem: string; // interno | cliente
  categoria: string | null;
  respostas: Record<string, string> | null;
  prazoDesejado: string | null;
  prazoConfirmado: string | null;
  anexos: string[];
  solicitanteNome: string | null;
  tarefaGeradaId: string | null;
  orcamentoPreparadoId: string | null;
};

const CORES_PRIORIDADE: Record<string, string> = { alta: "#EF4444", media: "#F59E0B", baixa: "#9CA3AF" };

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SolicitacoesTab({
  clienteId,
  solicitacoes,
  podeVerOrcamentos,
}: {
  clienteId: string;
  solicitacoes: SolicitacaoData[];
  // Etapa 3 (v157) — "preparar orçamento adicional" cria um Orçamento, então só
  // aparece pra quem já tem essa permissão (mesma trava de
  // POST /api/clientes/[id]/orcamentos) — esconder o botão de quem nem chegaria a
  // usar com sucesso.
  podeVerOrcamentos: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [extra, setExtra] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [convertendo, setConvertendo] = useState<string | null>(null);
  const [editandoPrazo, setEditandoPrazo] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    setEnviando(true);
    const res = await fetch(`/api/clientes/${clienteId}/solicitacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, prioridade, extra, categoria: categoria || undefined }),
    });
    setEnviando(false);
    if (!res.ok) {
      alert("Não consegui registrar essa solicitação. Tenta de novo.");
      return;
    }
    setDescricao("");
    setPrioridade("media");
    setExtra(false);
    setCategoria("");
    setAberto(false);
    router.refresh();
  }

  async function mudarStatus(id: string, status: string) {
    const res = await fetch(`/api/solicitacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert("Não consegui atualizar o status. Tenta de novo.");
      return;
    }
    router.refresh();
  }

  async function salvarPrazoConfirmado(id: string, prazoConfirmado: string) {
    const res = await fetch(`/api/solicitacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prazoConfirmado: prazoConfirmado || null }),
    });
    setEditandoPrazo(null);
    if (!res.ok) {
      alert("Não consegui salvar o prazo confirmado. Tenta de novo.");
      return;
    }
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir essa solicitação?")) return;
    const res = await fetch(`/api/solicitacoes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não consegui excluir essa solicitação. Tenta de novo.");
      return;
    }
    router.refresh();
  }

  async function transformarEmTarefa(id: string) {
    setConvertendo(id);
    const res = await fetch(`/api/solicitacoes/${id}/transformar-tarefa`, { method: "POST" });
    const dados = await res.json().catch(() => null);
    setConvertendo(null);
    if (!res.ok) {
      alert(dados?.erro || "Não consegui transformar essa solicitação em tarefa. Tenta de novo.");
      return;
    }
    router.refresh();
  }

  async function copiarLink() {
    const url = `${window.location.origin}/solicitar/${clienteId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      prompt("Copie o link abaixo:", url);
    }
  }

  const abertas = solicitacoes.filter((s) => s.status !== "concluida");
  const concluidas = solicitacoes.filter((s) => s.status === "concluida");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-text">Solicitações do cliente</p>
          <AjudaContextual
            titulo="Solicitações"
            texto="Pedidos do cliente — anotados por vocês (WhatsApp, reunião) ou enviados direto pelo formulário público. Marque como extra quando for algo fora do escopo combinado."
            exemplo="Ex.: registre 'Trocar a foto de capa do Instagram' com prioridade alta, ou mande o link do formulário pro cliente preencher sozinho."
          />
        </div>
        <button
          onClick={copiarLink}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs text-muted hover:border-accent/40 hover:text-text"
        >
          <Link2 size={12} /> {linkCopiado ? "Link copiado!" : "Copiar link pro cliente"}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        {abertas.map((s) => {
          const visual = s.categoria ? visualDaCategoriaTarefa(s.categoria) : null;
          const perguntas = perguntasParaCategoria(s.categoria);
          return (
            <div key={s.id} className="rounded-xl border border-border bg-card/60 p-3.5">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {s.origem === "cliente" && (
                    <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                      <MessageSquareText size={10} /> Pedido do cliente
                    </span>
                  )}
                  {visual && (
                    <span className="flex items-center gap-1 rounded-full bg-base/60 px-2 py-0.5 text-[10px] text-muted">
                      <visual.icone size={10} style={{ color: visual.cor }} /> {visual.label}
                    </span>
                  )}
                </div>
                <button onClick={() => excluir(s.id)} className="shrink-0 text-muted hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>

              <p className="mb-1.5 text-sm text-text">{s.descricao}</p>

              {perguntas.length > 0 && s.respostas && Object.keys(s.respostas).length > 0 && (
                <div className="mb-2 rounded-lg bg-base/40 p-2.5">
                  {perguntas.map((p) =>
                    s.respostas?.[p.chave] ? (
                      <p key={p.chave} className="text-[11px] leading-relaxed text-muted">
                        <span className="text-text/80">{p.rotulo}:</span> {s.respostas[p.chave]}
                      </p>
                    ) : null
                  )}
                </div>
              )}

              {s.anexos.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {s.anexos.map((a, i) => (
                    <a
                      key={i}
                      href={a}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-border bg-base/60 px-2 py-1 text-[11px] text-accent hover:underline"
                    >
                      <Paperclip size={10} /> Anexo {i + 1}
                    </a>
                  ))}
                </div>
              )}

              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                {s.solicitanteNome && <span>Pedido por {s.solicitanteNome}</span>}
                {s.prazoDesejado && <span>Prazo desejado: {formatarData(s.prazoDesejado)}</span>}
                {editandoPrazo === s.id ? (
                  <span className="flex items-center gap-1.5">
                    <DatePicker
                      value={s.prazoConfirmado?.slice(0, 10) || ""}
                      onChange={(v) => salvarPrazoConfirmado(s.id, v)}
                      placeholder="Prazo confirmado"
                      limpavel
                    />
                    <button onClick={() => setEditandoPrazo(null)} className="text-muted hover:text-text">
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button onClick={() => setEditandoPrazo(s.id)} className="text-accent hover:underline">
                    {s.prazoConfirmado ? `Prazo confirmado: ${formatarData(s.prazoConfirmado)}` : "Confirmar prazo"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px]"
                  style={{ backgroundColor: `${CORES_PRIORIDADE[s.prioridade]}1A`, color: CORES_PRIORIDADE[s.prioridade] }}
                >
                  {s.prioridade === "alta" ? "Alta" : s.prioridade === "media" ? "Média" : "Baixa"}
                </span>
                {s.extra && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                    <AlertCircle size={10} /> Fora do escopo
                  </span>
                )}

                {s.tarefaGeradaId ? (
                  <a
                    href={`/dashboard?tarefa=${s.tarefaGeradaId}`}
                    className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-text"
                  >
                    <ListChecks size={10} /> Ver tarefa
                  </a>
                ) : (
                  <button
                    onClick={() => transformarEmTarefa(s.id)}
                    disabled={convertendo === s.id}
                    className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-accent disabled:opacity-50"
                  >
                    <ClipboardCheck size={10} /> {convertendo === s.id ? "Transformando..." : "Transformar em tarefa"}
                  </button>
                )}

                {podeVerOrcamentos &&
                  (s.orcamentoPreparadoId ? (
                    <a
                      href={`/dashboard/clientes/${clienteId}?aba=orcamentos`}
                      className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-text"
                    >
                      <Receipt size={10} /> Orçamento preparado
                    </a>
                  ) : (
                    <a
                      href={`/dashboard/clientes/${clienteId}/orcamentos/novo?solicitacaoId=${s.id}`}
                      className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-accent"
                    >
                      <Receipt size={10} /> Preparar orçamento
                    </a>
                  ))}

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
          );
        })}
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
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="h-9 rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-9 rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
              title="Opcional — ajuda a transformar em tarefa e a preparar orçamento depois"
            >
              <option value="">Tipo (opcional)</option>
              {CATEGORIAS_TAREFA.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
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
