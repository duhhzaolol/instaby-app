"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check } from "lucide-react";

export type ChecklistItemData = { id: string; titulo: string; feito: boolean };

// Sub-passos de dentro de uma tarefa (redesign v144, Parte 2) — nasceu no "Fazendo
// agora" do Início do Editor, feito pra ser reaproveitado no painel lateral de
// tarefa que a Parte 3 vai construir (mesma API por baixo: /api/tarefas/[id]/checklist
// pra criar, /api/checklist/[id] pra marcar/apagar).
export function ChecklistTarefa({ tarefaId, itens, onChange }: { tarefaId: string; itens: ChecklistItemData[]; onChange?: () => void | Promise<void> }) {
  const router = useRouter();
  const [novo, setNovo] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novo.trim()) return;
    setAdicionando(true);
    const res = await fetch(`/api/tarefas/${tarefaId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: novo.trim() }),
    });
    setAdicionando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.erro || "Não consegui adicionar esse item.");
      return;
    }
    setNovo("");
    await onChange?.();
    router.refresh();
  }

  async function alternar(item: ChecklistItemData) {
    const res = await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feito: !item.feito }),
    });
    if (!res.ok) {
      alert("Não consegui atualizar esse item.");
      return;
    }
    await onChange?.();
    router.refresh();
  }

  async function remover(id: string) {
    const res = await fetch(`/api/checklist/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não consegui remover esse item.");
      return;
    }
    await onChange?.();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {itens.map((item) => (
        <div key={item.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-hover">
          <button
            aria-label={`${item.feito ? "Desmarcar" : "Concluir"} passo: ${item.titulo}`}
            onClick={() => alternar(item)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              item.feito ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent"
            }`}
          >
            <Check size={11} strokeWidth={3} />
          </button>
          <p className={`flex-1 text-sm ${item.feito ? "text-muted line-through" : "text-text"}`}>{item.titulo}</p>
          <button
            aria-label={`Remover passo: ${item.titulo}`}
            onClick={() => remover(item.id)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-red-400"
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <form onSubmit={adicionar} className="flex items-center gap-1.5 px-1.5">
        <Plus size={13} className="shrink-0 text-muted" />
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Adicionar passo..."
          disabled={adicionando}
          aria-label="Novo passo da tarefa"
          className="min-h-11 w-full min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </form>
    </div>
  );
}
