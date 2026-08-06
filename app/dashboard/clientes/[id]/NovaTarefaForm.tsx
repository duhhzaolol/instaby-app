"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovaTarefaForm({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("tarefa");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch(`/api/clientes/${clienteId}/tarefas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, tipo }),
    });

    setEnviando(false);

    if (resposta.ok) {
      setTitulo("");
      setAberto(false);
      router.refresh();
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-3 w-full rounded-lg border border-border bg-card py-2.5 text-sm text-white"
      >
        + Nova tarefa
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-border bg-card p-3">
      <input
        required
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="O que precisa ser feito?"
        className="mb-2 h-9 w-full rounded-md border border-border bg-base px-3 text-sm text-white outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-9 flex-1 rounded-md border border-border bg-base px-2 text-sm text-white"
        >
          <option value="tarefa">Tarefa</option>
          <option value="ideia">Ideia</option>
        </select>
        <button
          type="submit"
          disabled={enviando}
          className="h-9 rounded-md bg-accent px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
