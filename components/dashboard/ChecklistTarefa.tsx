"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check } from "lucide-react";

export type ChecklistItemData = { id: string; titulo: string; feito: boolean };

// Sub-passos de dentro de uma tarefa (redesign v144, Parte 2) — nasceu no "Fazendo
// agora" do Início do Editor, feito pra ser reaproveitado no painel lateral de
// tarefa que a Parte 3 vai construir (mesma API por baixo: /api/tarefas/[id]/checklist
// pra criar, /api/checklist/[id] pra marcar/apagar).
export function ChecklistTarefa({ tarefaId, itens }: { tarefaId: string; itens: ChecklistItemData[] }) {
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
    router.refresh();
  }

  async function remover(id: string) {
    const res = await fetch(`/api/checklist/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Não consegui remover esse item.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {itens.map((item) => (
        <div key={item.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-hover">
          <button
            onClick={() => alternar(item)}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
              item.feito ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent"
            }`}
          >
            <Check size={11} strokeWidth={3} />
          </button>
          <p className={`flex-1 text-sm ${item.feito ? "text-muted line-through" : "text-text"}`}>{item.titulo}</p>
          <button
            onClick={() => remover(item.id)}
            className="shrink-0 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
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
          className="h-7 w-full min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted/60"
        />
      </form>
    </div>
  );
}
