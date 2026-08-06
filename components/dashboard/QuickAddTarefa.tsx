"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";

type Cliente = { id: string; nome: string };

export function QuickAddTarefa({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);

    await fetch("/api/tarefas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, clienteId: clienteId || null }),
    });

    setTitulo("");
    setEnviando(false);
    router.refresh();
  }

  return (
    <Card hoverable={false} className="mb-6 p-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="O que precisa fazer? (digite e aperta enter)"
          className="h-11 flex-1 rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
        />
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="h-11 rounded-xl border border-border bg-base/60 px-3 text-sm text-text sm:w-44"
        >
          <option value="">Sem cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enviando || !titulo.trim()}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-40"
        >
          <Plus size={15} /> Adicionar
        </button>
      </form>
    </Card>
  );
}
