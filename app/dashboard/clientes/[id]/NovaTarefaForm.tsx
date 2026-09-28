"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { PRESETS_CHECKLIST } from "@/lib/presetsChecklist";

export default function NovaTarefaForm({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("tarefa");
  const [prazo, setPrazo] = useState("");
  const [checklistItens, setChecklistItens] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch(`/api/clientes/${clienteId}/tarefas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        tipo,
        prazo: prazo || null,
        checklistItens: checklistItens.length > 0 ? checklistItens : undefined,
      }),
    });

    setEnviando(false);

    if (resposta.ok) {
      setTitulo("");
      setPrazo("");
      setChecklistItens([]);
      setAberto(false);
      router.refresh();
    }
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text transition-colors hover:bg-hover"
      >
        <Plus size={14} /> Nova tarefa
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-xl border border-border bg-card/60 p-3">
      <input
        required
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="O que precisa ser feito?"
        className="mb-2 h-9 w-full rounded-lg border border-border bg-base px-3 text-sm text-text outline-none focus:border-accent/50"
      />
      <div className="flex gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-border bg-base px-2 text-sm text-text"
        >
          <option value="tarefa">Tarefa</option>
          <option value="ideia">Ideia</option>
        </select>
        <DatePicker value={prazo} onChange={setPrazo} placeholder="Prazo" className="w-32" limpavel />
        <button
          type="submit"
          disabled={enviando}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          Salvar
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-muted">Checklist:</span>
        {PRESETS_CHECKLIST.map((preset) => (
          <button
            key={preset.nome}
            type="button"
            onClick={() => setChecklistItens((prev) => (prev.join() === preset.itens.join() ? [] : preset.itens))}
            className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
              checklistItens.join() === preset.itens.join()
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-base text-muted hover:text-text"
            }`}
          >
            {preset.nome}
          </button>
        ))}
      </div>
    </form>
  );
}
