"use client";

import { useState } from "react";
import { Pencil, Trash2, Minus, Plus } from "lucide-react";
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
  onAtualizado,
  onRemovido,
}: {
  item: ServicoContratadoData;
  index: number;
  onAtualizado: (patch: Partial<ServicoContratadoData>) => void;
  onRemovido: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [quantidade, setQuantidade] = useState(item.quantidade);
  const [valor, setValor] = useState(item.valor);
  const [salvando, setSalvando] = useState(false);
  const [alterandoQtd, setAlterandoQtd] = useState(false);

  const temDesconto = item.valor < item.servico.valorUnitario * item.quantidade;

  async function salvar() {
    setSalvando(true);
    onAtualizado({ quantidade, valor }); // atualiza a tela na hora
    await fetch(`/api/servicos-contratados/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade, valor }),
    });
    setSalvando(false);
    setEditando(false);
  }

  async function remover() {
    if (!confirm(`Remover "${item.servico.nome}" dos serviços contratados?`)) return;
    onRemovido(); // some da tela na hora
    await fetch(`/api/servicos-contratados/${item.id}`, { method: "DELETE" });
  }

  // muda a quantidade direto na linha — mantém o valor por unidade que já estava
  // valendo (com desconto ou não), sem precisar abrir o modo de editar
  async function alterarQuantidade(delta: number) {
    const novaQuantidade = Math.max(1, item.quantidade + delta);
    if (novaQuantidade === item.quantidade) return;
    const valorPorUnidade = item.valor / item.quantidade;
    const novoValor = Math.round(valorPorUnidade * novaQuantidade);

    setAlterandoQtd(true);
    onAtualizado({ quantidade: novaQuantidade, valor: novoValor }); // atualiza a tela na hora, sem esperar o servidor
    await fetch(`/api/servicos-contratados/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade: novaQuantidade, valor: novoValor }),
    });
    setAlterandoQtd(false);
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
    <Card index={index} hoverable={false} className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-text">{item.servico.nome}</p>
        {temDesconto && (
          <p className="text-xs text-muted">
            <span className="line-through">R$ {(item.servico.valorUnitario * item.quantidade).toFixed(0)}</span>{" "}
            <span className="text-accent">com desconto</span>
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-base/60 px-1">
          <button
            onClick={() => alterarQuantidade(-1)}
            disabled={alterandoQtd || item.quantidade <= 1}
            className="flex h-7 w-7 items-center justify-center text-muted hover:text-text disabled:opacity-30"
          >
            <Minus size={12} />
          </button>
          <span className="w-5 text-center text-sm text-text">{item.quantidade}</span>
          <button
            onClick={() => alterarQuantidade(1)}
            disabled={alterandoQtd}
            className="flex h-7 w-7 items-center justify-center text-muted hover:text-text disabled:opacity-30"
          >
            <Plus size={12} />
          </button>
        </div>
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
