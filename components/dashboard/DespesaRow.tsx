"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Repeat } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type DespesaRowData = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  cliente?: string | null;
  recorrente?: boolean;
};

export function DespesaRow({ despesa, index }: { despesa: DespesaRowData; index: number }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [descricao, setDescricao] = useState(despesa.descricao);
  const [valor, setValor] = useState(despesa.valor);
  const [data, setData] = useState(despesa.data.slice(0, 10));
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/despesas/${despesa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, valor, data }),
    });
    setSalvando(false);
    setEditando(false);
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir essa despesa?")) return;
    await fetch(`/api/despesas/${despesa.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editando) {
    return (
      <Card index={index} hoverable={false} className="p-3.5">
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mb-2" />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <CurrencyInput value={valor} onChange={setValor} />
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          />
        </div>
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
        <p className="flex items-center gap-1.5 text-sm text-text">
          {despesa.descricao}
          {despesa.recorrente && (
            <span title="Recorrente — repete todo mês sozinha">
              <Repeat size={11} className="text-accent" />
            </span>
          )}
        </p>
        <p className="text-xs text-muted">
          {despesa.cliente && `${despesa.cliente} · `}
          {new Date(despesa.data).toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text">R$ {despesa.valor.toFixed(0)}</span>
        <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
          <Pencil size={13} />
        </button>
        <button onClick={excluir} className="text-muted hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );
}
