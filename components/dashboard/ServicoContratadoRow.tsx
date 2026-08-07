"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

export type ServicoContratadoData = {
  id: string;
  quantidade: number;
  valor: number;
  servico: { nome: string; valorUnitario: number };
};

export function ServicoContratadoRow({
  item,
  index,
}: {
  item: ServicoContratadoData;
  index: number;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [quantidade, setQuantidade] = useState(item.quantidade);
  const [valor, setValor] = useState(item.valor);
  const [salvando, setSalvando] = useState(false);

  const temDesconto = item.valor < item.servico.valorUnitario * item.quantidade;

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/servicos-contratados/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade, valor }),
    });
    setSalvando(false);
    setEditando(false);
    router.refresh();
  }

  async function remover() {
    if (!confirm(`Remover "${item.servico.nome}" dos serviços contratados?`)) return;
    await fetch(`/api/servicos-contratados/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editando) {
    return (
      <Card index={index} hoverable={false} className="p-3.5">
        <p className="mb-2 text-sm text-text">{item.servico.nome}</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              className="h-10 w-full rounded-xl border border-border bg-base px-3 text-sm text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Valor combinado</label>
            <CurrencyInput value={valor} onChange={setValor} />
          </div>
        </div>
        <p className="mb-3 text-[11px] text-muted">
          Catálogo: R$ {(item.servico.valorUnitario * quantidade).toFixed(0)} — ajuste pra aplicar desconto.
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
    <Card index={index} hoverable={false} className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm text-text">
          {item.servico.nome}
          {item.quantidade > 1 && <span className="text-muted"> · x{item.quantidade}</span>}
        </p>
        {temDesconto && (
          <p className="text-xs text-muted">
            <span className="line-through">R$ {(item.servico.valorUnitario * item.quantidade).toFixed(0)}</span>{" "}
            <span className="text-accent">com desconto</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text">R$ {item.valor.toFixed(0)}</span>
        <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
          <Pencil size={13} />
        </button>
        <button onClick={remover} className="text-muted hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );
}
