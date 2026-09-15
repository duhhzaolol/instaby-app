"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { CATEGORIAS_RECEITA } from "@/lib/categoriasFinanceiras";

type Cliente = { id: string; nome: string };

export function NovaContaReceberForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState("");
  const [categoria, setCategoria] = useState("Serviços");
  const [tipo, setTipo] = useState("unica");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || valor <= 0) return;
    setEnviando(true);
    await fetch(`/api/clientes/${clienteId}/cobrancas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valor,
        tipo,
        categoria,
        status: "pendente",
        vencimento: vencimento || null,
      }),
    });
    setEnviando(false);
    setClienteId("");
    setValor(0);
    setVencimento("");
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent hover:bg-accent/10"
      >
        <Plus size={15} /> Nova conta a receber
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova conta a receber</p>
        <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>

      <select
        required
        value={clienteId}
        onChange={(e) => setClienteId(e.target.value)}
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
      >
        <option value="">Escolher cliente...</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <CurrencyInput value={valor} onChange={setValor} />
        <DatePicker value={vencimento} onChange={setVencimento} placeholder="Vencimento" limpavel />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          {CATEGORIAS_RECEITA.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        >
          <option value="unica">Única</option>
          <option value="recorrente">Recorrente</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={enviando || !clienteId || valor <= 0}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Salvando..." : "Salvar como pendente"}
      </button>
    </form>
  );
}
