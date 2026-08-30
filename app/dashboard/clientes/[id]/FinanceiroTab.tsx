"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CobrancaRow, CobrancaRowData } from "@/components/dashboard/CobrancaRow";
import { DespesaRow, DespesaRowData } from "@/components/dashboard/DespesaRow";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORIAS_RECEITA } from "@/lib/categoriasFinanceiras";

export default function FinanceiroTab({
  clienteId,
  cobrancas,
  despesas,
}: {
  clienteId: string;
  cobrancas: CobrancaRowData[];
  despesas: DespesaRowData[];
}) {
  const [formAberto, setFormAberto] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted">Cobranças</p>
        <button
          onClick={() => setFormAberto((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          <Plus size={12} /> Lançar cobrança
        </button>
      </div>

      {formAberto && <NovaCobrancaForm clienteId={clienteId} onSalvo={() => setFormAberto(false)} />}

      <div className="mb-6 flex flex-col gap-2">
        {cobrancas.length === 0 && <p className="text-sm text-muted">Nenhuma cobrança ainda.</p>}
        {cobrancas.map((c, i) => (
          <CobrancaRow key={c.id} cobranca={c} index={i} />
        ))}
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Despesas</p>
      <div className="flex flex-col gap-2">
        {despesas.length === 0 && <p className="text-sm text-muted">Nenhuma despesa ainda.</p>}
        {despesas.map((d, i) => (
          <DespesaRow key={d.id} despesa={d} index={i} />
        ))}
      </div>
    </div>
  );
}

function NovaCobrancaForm({ clienteId, onSalvo }: { clienteId: string; onSalvo: () => void }) {
  const router = useRouter();
  const [valor, setValor] = useState(0);
  const [tipo, setTipo] = useState("recorrente");
  const [categoria, setCategoria] = useState("Serviços");
  const [status, setStatus] = useState("pago");
  const [data, setData] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    await fetch(`/api/clientes/${clienteId}/cobrancas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valor,
        tipo,
        categoria,
        status,
        vencimento: data || undefined,
        data: status === "pago" ? data || undefined : undefined,
      }),
    });

    setEnviando(false);
    onSalvo();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-border bg-base/60 p-3">
      <p className="mb-2 text-[11px] text-muted">
        Use "Pago" com uma data passada pra lançar meses que você já recebeu.
      </p>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <Label>Valor</Label>
          <CurrencyInput value={valor} onChange={setValor} />
        </div>
        <div>
          <Label>Data</Label>
          <Input required type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <Label>Tipo</Label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="recorrente">Recorrente</option>
            <option value="unica">Única</option>
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <Label>Categoria da receita</Label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          {CATEGORIAS_RECEITA.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={enviando || valor <= 0} className="w-full">
        {enviando ? "Salvando..." : "Lançar cobrança"}
      </Button>
    </form>
  );
}
