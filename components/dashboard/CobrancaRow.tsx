"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

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

export type CobrancaRowData = {
  id: string;
  valor: number;
  status: string;
  tipo: string;
  vencimento: string | null;
};

export function CobrancaRow({
  cobranca,
  index,
  clienteNome,
}: {
  cobranca: CobrancaRowData;
  index: number;
  clienteNome?: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(cobranca.valor);
  const [tipo, setTipo] = useState(cobranca.tipo);
  const [vencimento, setVencimento] = useState(cobranca.vencimento?.slice(0, 10) || "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/cobrancas/${cobranca.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor, tipo, vencimento: vencimento || null }),
    });
    setSalvando(false);
    setEditando(false);
    router.refresh();
  }

  async function marcarPago() {
    await fetch(`/api/cobrancas/${cobranca.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago" }),
    });
    router.refresh();
  }

  if (editando) {
    return (
      <Card index={index} hoverable={false} className="p-3.5">
        <div className="mb-2 grid grid-cols-2 gap-2">
          <CurrencyInput value={valor} onChange={setValor} />
          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          />
        </div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="recorrente">Recorrente</option>
          <option value="unica">Única</option>
        </select>
        <div className="flex gap-2">
          <Button size="sm" onClick={salvar} disabled={salvando} className="flex-1">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card index={index} hoverable={false} className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm text-text">
          {clienteNome && `${clienteNome} · `}R$ {cobranca.valor.toFixed(0)}
        </p>
        <p className="text-xs text-muted">
          {cobranca.tipo === "recorrente" ? "Recorrente" : "Única"}
          {cobranca.vencimento && ` · vence ${new Date(cobranca.vencimento).toLocaleDateString("pt-BR")}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={tone[cobranca.status]}>{label[cobranca.status]}</Badge>
        {cobranca.status !== "pago" && (
          <button onClick={marcarPago} className="text-xs font-medium text-accent hover:underline">
            Marcar pago
          </button>
        )}
        <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
          <Pencil size={13} />
        </button>
      </div>
    </Card>
  );
}
