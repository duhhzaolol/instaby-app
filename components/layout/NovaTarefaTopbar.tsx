"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";
import { DatePicker } from "@/components/ui/DatePicker";

type Cliente = { id: string; nome: string; cor: string | null };

// Botão vermelho "Nova tarefa" da barra do topo (redesign v144, Parte 1) —
// mesma rota /api/tarefas que o formulário de dentro da página de Tarefas
// (components/dashboard/NovaTarefaGlobalForm.tsx) já usa, só que num modal,
// porque esse botão precisa funcionar de qualquer tela do painel, não só
// de dentro de Tarefas (onde dava pra expandir o formulário na própria página).
export function NovaTarefaTopbar({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prazo, setPrazo] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  function fechar() {
    setAberto(false);
    setTitulo("");
    setClienteId("");
    setCategoria("");
    setPrazo("");
    setHora("");
    setObservacao("");
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          clienteId: clienteId || null,
          categoria: categoria || null,
          descricao: observacao || null,
          prazo: prazo ? `${prazo}T${hora || "00:00"}:00-03:00` : null,
        }),
      });
      if (res.ok) {
        fechar();
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Nova tarefa"
        onClick={() => setAberto(true)}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-semibold text-white transition-colors hover:brightness-110"
      >
        <Plus size={15} />
        <span className="hidden sm:inline">Nova tarefa</span>
      </button>

      {aberto && typeof document !== "undefined" && createPortal(
          <>
            <button
              type="button"
              aria-label="Fechar nova tarefa pelo fundo"
              data-testid="fundo-nova-tarefa"
              onClick={fechar}
              className="fixed inset-0 z-40 h-full w-full bg-black/60"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex flex-col overflow-y-auto p-4">
            <motion.div
              role="dialog"
              aria-labelledby="titulo-nova-tarefa"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto my-auto w-full max-w-sm shrink-0 self-center rounded-2xl border border-border bg-card p-4 shadow-premium-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <p id="titulo-nova-tarefa" className="text-sm font-medium text-text">Nova tarefa</p>
                <button type="button" aria-label="Fechar nova tarefa" onClick={fechar} className="text-muted hover:text-text">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={salvar}>
                <input
                  autoFocus
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="O que precisa ser feito?"
                  className="mb-3 h-10 w-full rounded-xl border border-border bg-inset px-3.5 text-sm text-text outline-none focus:border-accent/50"
                />

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-inset px-3 text-sm text-text"
                  >
                    <option value="">Sem cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-inset px-3 text-sm text-text"
                  >
                    <option value="">Categoria (opcional)</option>
                    {CATEGORIAS_TAREFA.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <DatePicker value={prazo} onChange={setPrazo} placeholder="Prazo (opcional)" limpavel />
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    disabled={!prazo}
                    className="h-10 w-full rounded-xl border border-border bg-inset px-3 text-sm text-text disabled:opacity-40"
                  />
                </div>

                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                  placeholder="Observação (opcional)"
                  className="mb-3 w-full rounded-xl border border-border bg-inset px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50 focus:border-accent/50"
                />

                <button
                  type="submit"
                  disabled={enviando || !titulo.trim()}
                  className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
                >
                  {enviando ? "Criando..." : "Criar tarefa"}
                </button>
              </form>
            </motion.div>
            </div>
          </>
          , document.querySelector(".tema-painel") || document.body
      )}
    </>
  );
}
