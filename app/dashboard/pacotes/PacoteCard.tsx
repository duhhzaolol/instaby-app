"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

type Item = { id: string; quantidade: number; servico: { nome: string; valorUnitario: number } };
type Pacote = { id: string; nome: string; descricao: string | null; itens: Item[] };

export default function PacoteCard({ pacote, index }: { pacote: Pacote; index: number }) {
  const router = useRouter();
  const total = pacote.itens.reduce((s, it) => s + Number(it.servico.valorUnitario) * it.quantidade, 0);

  async function deletar() {
    await fetch(`/api/pacotes/${pacote.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card index={index} hoverable={false} className="p-4">
      <p className="mb-1 text-sm font-medium text-text">{pacote.nome}</p>
      {pacote.descricao && <p className="mb-3 text-xs text-muted">{pacote.descricao}</p>}
      <div className="mb-3 flex flex-col gap-1">
        {pacote.itens.map((it) => (
          <p key={it.id} className="text-xs text-muted">
            · {it.servico.nome}
            {it.quantidade > 1 && ` (x${it.quantidade})`}
          </p>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-medium text-accent">R$ {total.toFixed(0)}</span>
        <button onClick={deletar} className="text-muted hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  );
}
