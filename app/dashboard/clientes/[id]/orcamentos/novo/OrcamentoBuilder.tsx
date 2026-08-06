"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Servico = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string | null;
  valorUnitario: number;
};

type Selecionado = { servicoId: string; quantidade: number };

export default function OrcamentoBuilder({
  clienteId,
  clienteNome,
  servicos,
}: {
  clienteId: string;
  clienteNome: string;
  servicos: Servico[];
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Record<string, Selecionado>>({});
  const [enviando, setEnviando] = useState(false);

  const categorias = useMemo(
    () => Array.from(new Set(servicos.map((s) => s.categoria))),
    [servicos]
  );

  function alternar(servico: Servico) {
    setSelecionados((atual) => {
      const copia = { ...atual };
      if (copia[servico.id]) {
        delete copia[servico.id];
      } else {
        copia[servico.id] = { servicoId: servico.id, quantidade: 1 };
      }
      return copia;
    });
  }

  function mudarQuantidade(servicoId: string, quantidade: number) {
    setSelecionados((atual) => ({
      ...atual,
      [servicoId]: { ...atual[servicoId], quantidade: Math.max(1, quantidade) },
    }));
  }

  const total = Object.values(selecionados).reduce((soma, sel) => {
    const servico = servicos.find((s) => s.id === sel.servicoId);
    if (!servico) return soma;
    return soma + Number(servico.valorUnitario) * sel.quantidade;
  }, 0);

  async function gerar() {
    setEnviando(true);

    const itens = Object.values(selecionados).map((sel) => {
      const servico = servicos.find((s) => s.id === sel.servicoId)!;
      return {
        servicoId: sel.servicoId,
        quantidade: sel.quantidade,
        valor: Number(servico.valorUnitario) * sel.quantidade,
      };
    });

    const resposta = await fetch(`/api/clientes/${clienteId}/orcamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens }),
    });

    setEnviando(false);

    if (resposta.ok) {
      router.push(`/dashboard/clientes/${clienteId}?aba=orcamentos`);
      router.refresh();
    }
  }

  return (
    <div>
      {categorias.map((cat) => (
        <div key={cat} className="mb-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {servicos
              .filter((s) => s.categoria === cat)
              .map((s) => {
                const ativo = !!selecionados[s.id];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => alternar(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      ativo
                        ? "bg-accent text-black"
                        : "border border-border bg-card/60 text-muted hover:text-text"
                    }`}
                  >
                    {s.nome}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {Object.keys(selecionados).length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {Object.values(selecionados).map((sel) => {
            const servico = servicos.find((s) => s.id === sel.servicoId)!;
            return (
              <div
                key={sel.servicoId}
                className="flex items-center justify-between rounded-xl bg-card/60 px-3.5 py-2.5"
              >
                <p className="text-sm text-text">{servico.nome}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={sel.quantidade}
                    onChange={(e) => mudarQuantidade(sel.servicoId, parseInt(e.target.value) || 1)}
                    className="h-8 w-14 rounded-lg border border-border bg-base px-2 text-center text-sm text-text"
                  />
                  <span className="w-16 text-right text-sm text-text">
                    R$ {(Number(servico.valorUnitario) * sel.quantidade).toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-medium text-text">Total</span>
        <span className="text-lg font-medium text-accent">R$ {total.toFixed(0)}</span>
      </div>

      <button
        onClick={gerar}
        disabled={enviando || Object.keys(selecionados).length === 0}
        className="mt-4 h-11 w-full rounded-xl bg-accent text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-40"
      >
        {enviando ? "Gerando..." : "Gerar página do orçamento"}
      </button>
    </div>
  );
}
