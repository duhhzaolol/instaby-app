"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import AceitarButton from "./AceitarButton";

type Item = {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
  valor: number;
};

export default function OrcamentoInterativo({
  slug,
  status,
  itensIniciais,
}: {
  slug: string;
  status: string;
  itensIniciais: Item[];
}) {
  const [itens, setItens] = useState(
    itensIniciais.map((i) => ({ ...i, valorUnitario: i.quantidade > 0 ? i.valor / i.quantidade : i.valor }))
  );

  function mudarQuantidade(id: string, delta: number) {
    setItens((atual) =>
      atual.map((item) => {
        if (item.id !== id) return item;
        const novaQtd = Math.max(0, item.quantidade + delta);
        return { ...item, quantidade: novaQtd, valor: Math.round(novaQtd * item.valorUnitario * 100) / 100 };
      })
    );
  }

  const total = itens.reduce((soma, i) => soma + i.valor, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wide text-[#9CA3AF]">o que está incluso</p>
        <p className="text-[10px] text-[#9CA3AF]">ajuste as quantidades se quiser</p>
      </div>

      <div className="mb-8 flex flex-col gap-2.5">
        {itens.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl bg-[#111827] p-4 transition-opacity ${item.quantidade === 0 ? "opacity-40" : ""}`}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-[#F9FAFB]">{item.nome}</p>
              <span className="text-sm font-medium text-[#E63946]">R$ {item.valor.toFixed(0)}</span>
            </div>
            {item.descricao && (
              <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">{item.descricao}</p>
            )}
            <div className="mt-2.5 flex items-center gap-3">
              <button
                onClick={() => mudarQuantidade(item.id, -1)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[#F9FAFB] hover:bg-white/5"
              >
                <Minus size={11} />
              </button>
              <span className="w-6 text-center text-xs text-[#F9FAFB]">{item.quantidade}</span>
              <button
                onClick={() => mudarQuantidade(item.id, 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-[#F9FAFB] hover:bg-white/5"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="text-sm font-medium text-[#F9FAFB]">Total mensal</span>
        <span className="text-xl font-medium text-[#E63946]">R$ {total.toFixed(0)}</span>
      </div>

      <AceitarButton
        slug={slug}
        status={status}
        itensParaSalvar={itens.map((i) => ({ id: i.id, quantidade: i.quantidade, valor: i.valor }))}
      />
    </div>
  );
}
