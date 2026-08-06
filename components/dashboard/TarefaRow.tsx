"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

const tarefaTone: Record<string, "gray" | "yellow" | "green"> = {
  a_fazer: "gray",
  em_andamento: "yellow",
  feito: "green",
};

const tarefaStatusLabel: Record<string, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  feito: "Feito",
};

export type TarefaRowData = { id: string; titulo: string; tipo: string; status: string };

export function TarefaRow({ tarefa, index }: { tarefa: TarefaRowData; index: number }) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function mudarStatus(status: string) {
    await fetch(`/api/tarefas/${tarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir essa tarefa?")) return;
    setExcluindo(true);
    await fetch(`/api/tarefas/${tarefa.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card index={index} hoverable={false} className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm text-text">{tarefa.titulo}</p>
        <p className="text-xs text-muted">{tarefa.tipo === "ideia" ? "Ideia" : "Tarefa"}</p>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={tarefa.status}
          onChange={(e) => mudarStatus(e.target.value)}
          className={`rounded-full border px-2.5 py-1 text-xs ${
            tarefa.status === "feito"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : tarefa.status === "em_andamento"
              ? "border-accent/20 bg-accent/10 text-accent"
              : "border-white/10 bg-white/5 text-muted"
          }`}
        >
          <option value="a_fazer">A fazer</option>
          <option value="em_andamento">Em andamento</option>
          <option value="feito">Feito</option>
        </select>
        <button onClick={excluir} disabled={excluindo} className="text-muted hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );
}
