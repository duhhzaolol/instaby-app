"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Cobranca = { id: string; valor: number; status: string; tipo: string; vencimento: string | null };
type Despesa = { id: string; descricao: string; valor: number; data: string };

const tone: Record<string, "green" | "red" | "yellow"> = {
  pago: "green",
  atrasado: "red",
  pendente: "yellow",
};

const label: Record<string, string> = {
  pago: "Pago",
  atrasado: "Atrasado",
  pendente: "Pendente",
};

export default function FinanceiroTab({
  clienteId,
  cobrancas,
  despesas,
}: {
  clienteId: string;
  cobrancas: Cobranca[];
  despesas: Despesa[];
}) {
  const router = useRouter();
  const [formAberto, setFormAberto] = useState(false);

  async function marcarPago(id: string) {
    await fetch(`/api/cobrancas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago" }),
    });
    router.refresh();
  }

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

      {formAberto && (
        <NovaCobrancaForm clienteId={clienteId} onSalvo={() => setFormAberto(false)} />
      )}

      <div className="mb-6 flex flex-col gap-2">
        {cobrancas.length === 0 && <p className="text-sm text-muted">Nenhuma cobrança ainda.</p>}
        {cobrancas.map((c, i) => (
          <Card key={c.id} index={i} hoverable={false} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-text">R$ {c.valor.toFixed(0)}</p>
              <p className="text-xs text-muted">
                {c.tipo === "recorrente" ? "Recorrente" : "Única"}
                {c.vencimento && ` · vence ${new Date(c.vencimento).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={tone[c.status]}>{label[c.status]}</Badge>
              {c.status !== "pago" && (
                <button onClick={() => marcarPago(c.id)} className="text-xs font-medium text-accent hover:underline">
                  Marcar pago
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Despesas</p>
      <div className="flex flex-col gap-2">
        {despesas.length === 0 && <p className="text-sm text-muted">Nenhuma despesa ainda.</p>}
        {despesas.map((d, i) => (
          <Card key={d.id} index={i} hoverable={false} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-text">{d.descricao}</p>
              <p className="text-xs text-muted">{new Date(d.data).toLocaleDateString("pt-BR")}</p>
            </div>
            <span className="text-sm text-text">R$ {d.valor.toFixed(0)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NovaCobrancaForm({ clienteId, onSalvo }: { clienteId: string; onSalvo: () => void }) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("recorrente");
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
        valor: parseFloat(valor),
        tipo,
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
          <Label>Valor (R$)</Label>
          <Input required type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
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
      <Button type="submit" size="sm" disabled={enviando} className="w-full">
        {enviando ? "Salvando..." : "Lançar cobrança"}
      </Button>
    </form>
  );
}
