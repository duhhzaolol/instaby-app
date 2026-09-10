"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CATEGORIAS_TAREFA } from "@/lib/categoriaTarefaVisual";
import { DatePicker } from "@/components/ui/DatePicker";

type Cliente = { id: string; nome: string; cor: string | null };

export function NovaTarefaGlobalForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prazo, setPrazo] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  function limpar() {
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

    await fetch("/api/tarefas", {
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

    setEnviando(false);
    limpar();
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-card/40 py-3 text-sm text-muted hover:border-accent/40 hover:text-text"
      >
        <Plus size={15} /> Nova tarefa
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova tarefa</p>
        <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        required
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="O que precisa ser feito?"
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text outline-none focus:border-accent/50"
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
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
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
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
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text disabled:opacity-40"
        />
      </div>

      <textarea
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        rows={2}
        placeholder="Observação (opcional)"
        className="mb-3 w-full rounded-xl border border-border bg-base/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50 focus:border-accent/50"
      />

      <button
        type="submit"
        disabled={enviando || !titulo.trim()}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Criando..." : "Criar tarefa"}
      </button>
    </form>
  );
}
