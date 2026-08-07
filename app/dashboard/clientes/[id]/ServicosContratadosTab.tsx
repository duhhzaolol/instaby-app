"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ServicoContratadoRow, ServicoContratadoData } from "@/components/dashboard/ServicoContratadoRow";

type Servico = { id: string; nome: string; categoria: string; valorUnitario: number };
type Contratado = ServicoContratadoData & { servicoId: string };

export default function ServicosContratadosTab({
  clienteId,
  contratados,
  catalogo,
}: {
  clienteId: string;
  contratados: Contratado[];
  catalogo: Servico[];
}) {
  const router = useRouter();
  const [adicionando, setAdicionando] = useState<string | null>(null);

  const jaContratadosIds = new Set(contratados.map((c) => c.servicoId));
  const categorias = useMemo(() => Array.from(new Set(catalogo.map((s) => s.categoria))), [catalogo]);

  const total = contratados.reduce((soma, c) => soma + c.valor, 0);

  async function adicionar(servico: Servico) {
    setAdicionando(servico.id);
    await fetch(`/api/clientes/${clienteId}/servicos-contratados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicoId: servico.id, quantidade: 1, valor: servico.valorUnitario }),
    });
    setAdicionando(null);
    router.refresh();
  }

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Serviços contratados</p>

      <div className="mb-4 flex flex-col gap-2">
        {contratados.length === 0 && (
          <p className="text-sm text-muted">Nenhum serviço contratado ainda — adicione abaixo.</p>
        )}
        {contratados.map((c, i) => (
          <ServicoContratadoRow key={c.id} item={c} index={i} />
        ))}
      </div>

      {contratados.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
          <span className="text-sm font-medium text-text">Mensalidade (soma dos serviços)</span>
          <span className="text-lg font-medium text-accent">R$ {total.toFixed(0)}</span>
        </div>
      )}

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Adicionar do catálogo</p>
      {catalogo.length === 0 ? (
        <p className="text-sm text-muted">Cadastre serviços no catálogo primeiro.</p>
      ) : (
        categorias.map((cat) => (
          <div key={cat} className="mb-3">
            <p className="mb-1.5 text-[11px] text-muted">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {catalogo
                .filter((s) => s.categoria === cat)
                .map((s) => {
                  const jaTem = jaContratadosIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={jaTem || adicionando === s.id}
                      onClick={() => adicionar(s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        jaTem
                          ? "cursor-default border border-border bg-transparent text-muted/40"
                          : "border border-border bg-card/60 text-muted hover:border-accent/30 hover:text-text"
                      }`}
                    >
                      {jaTem ? "✓ " : "+ "}
                      {s.nome}
                    </button>
                  );
                })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
