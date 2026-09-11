"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";
import { calcularStatusEfetivo, LABEL_STATUS_EFETIVO } from "@/lib/statusFinanceiro";

const toneEfetivo: Record<string, "green" | "red" | "yellow" | "gray" | "blue"> = {
  pago: "green",
  atrasado: "red",
  pendente: "yellow",
  parcial: "blue",
  cancelado: "gray",
};

export type CobrancaRowData = {
  id: string;
  valor: number;
  status: string;
  tipo: string;
  vencimento: string | null;
  totalPago?: number;
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
  const [lancandoBaixa, setLancandoBaixa] = useState(false);
  const [valorBaixa, setValorBaixa] = useState(0);
  const [valor, setValor] = useState(cobranca.valor);
  const [tipo, setTipo] = useState(cobranca.tipo);
  const [status, setStatus] = useState(cobranca.status);
  const [vencimento, setVencimento] = useState(cobranca.vencimento?.slice(0, 10) || "");
  const [salvando, setSalvando] = useState(false);

  const totalPago = cobranca.totalPago || 0;
  const saldo = Math.max(0, cobranca.valor - totalPago);
  const statusEfetivo = calcularStatusEfetivo({
    status: cobranca.status,
    valor: cobranca.valor,
    totalPago,
    vencimento: cobranca.vencimento ? new Date(cobranca.vencimento) : null,
  });

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/cobrancas/${cobranca.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor, tipo, status, vencimento: vencimento || null }),
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

  async function lancarBaixa() {
    if (valorBaixa <= 0) return;
    await fetch(`/api/cobrancas/${cobranca.id}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: valorBaixa }),
    });
    setValorBaixa(0);
    setLancandoBaixa(false);
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir essa cobrança?")) return;
    await fetch(`/api/cobrancas/${cobranca.id}`, { method: "DELETE" });
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
          className="mb-2 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="recorrente">Recorrente</option>
          <option value="unica">Única</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mb-1 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Recebido</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <p className="mb-3 text-[11px] text-muted">
          "Atrasado" não se escolhe mais aqui — o sistema calcula sozinho quando o vencimento passa e ainda tem saldo.
        </p>
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
    <Card index={index} hoverable={false} className="p-0">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm text-text">
            {clienteNome && `${clienteNome} · `}R$ {cobranca.valor.toFixed(0)}
          </p>
          <p className="text-xs text-muted">
            {cobranca.tipo === "recorrente" ? "Recorrente" : "Única"}
            {cobranca.vencimento && ` · vence ${new Date(cobranca.vencimento).toLocaleDateString("pt-BR")}`}
            {totalPago > 0 && saldo > 0 && ` · recebido R$ ${totalPago.toFixed(0)}, saldo R$ ${saldo.toFixed(0)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={toneEfetivo[statusEfetivo]}>{LABEL_STATUS_EFETIVO[statusEfetivo]}</Badge>
          {statusEfetivo !== "pago" && statusEfetivo !== "cancelado" && (
            <button onClick={() => setLancandoBaixa((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              <Plus size={11} /> Baixa
            </button>
          )}
          {statusEfetivo !== "pago" && (
            <button onClick={marcarPago} className="text-xs font-medium text-accent hover:underline">
              Tudo pago
            </button>
          )}
          <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
            <Pencil size={13} />
          </button>
          <button onClick={excluir} className="text-muted hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {lancandoBaixa && (
        <div className="flex items-center gap-2 border-t border-border p-3">
          <CurrencyInput value={valorBaixa} onChange={setValorBaixa} className="flex-1" />
          <Button size="sm" onClick={lancarBaixa} disabled={valorBaixa <= 0}>
            Lançar baixa
          </Button>
        </div>
      )}
    </Card>
  );
}
