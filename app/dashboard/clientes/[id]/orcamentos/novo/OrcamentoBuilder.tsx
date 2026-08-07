"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import DeslocamentoCalc from "./DeslocamentoCalc";

type Servico = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string | null;
  valorUnitario: number;
};

type Selecionado = { servicoId: string; quantidade: number; valor: number };
type Pacote = { id: string; nome: string; itens: { servicoId: string; quantidade: number }[] };

export default function OrcamentoBuilder({
  clienteId,
  clienteNome,
  servicos,
  pacotes,
  selecaoInicial,
}: {
  clienteId: string;
  clienteNome: string;
  servicos: Servico[];
  pacotes: Pacote[];
  selecaoInicial?: { servicoId: string; quantidade: number }[];
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Record<string, Selecionado>>(
    Object.fromEntries(
      (selecaoInicial || []).map((s) => {
        const servico = servicos.find((sv) => sv.id === s.servicoId);
        return [s.servicoId, { servicoId: s.servicoId, quantidade: s.quantidade, valor: (servico?.valorUnitario || 0) * s.quantidade }];
      })
    )
  );
  const [enviando, setEnviando] = useState(false);

  function aplicarPacote(pacote: Pacote) {
    setSelecionados((atual) => {
      const copia = { ...atual };
      pacote.itens.forEach((i) => {
        const servico = servicos.find((sv) => sv.id === i.servicoId);
        copia[i.servicoId] = {
          servicoId: i.servicoId,
          quantidade: i.quantidade,
          valor: (servico?.valorUnitario || 0) * i.quantidade,
        };
      });
      return copia;
    });
  }

  const categorias = useMemo(
    () => Array.from(new Set(servicos.map((s) => s.categoria))),
    [servicos]
  );

  const itensSelecionados = Object.values(selecionados)
    .map((sel) => {
      const servico = servicos.find((s) => s.id === sel.servicoId);
      if (!servico) return null;
      return { servico, quantidade: sel.quantidade, valor: sel.valor };
    })
    .filter(Boolean) as { servico: Servico; quantidade: number; valor: number }[];

  const total = itensSelecionados.reduce((soma, i) => soma + i.valor, 0);

  function alternar(servico: Servico) {
    setSelecionados((atual) => {
      const copia = { ...atual };
      if (copia[servico.id]) {
        delete copia[servico.id];
      } else {
        copia[servico.id] = { servicoId: servico.id, quantidade: 1, valor: servico.valorUnitario };
      }
      return copia;
    });
  }

  function mudarQuantidade(servicoId: string, quantidade: number) {
    const servico = servicos.find((s) => s.id === servicoId);
    const qtd = Math.max(1, quantidade);
    setSelecionados((atual) => ({
      ...atual,
      [servicoId]: { ...atual[servicoId], quantidade: qtd, valor: (servico?.valorUnitario || 0) * qtd },
    }));
  }

  function mudarValor(servicoId: string, valor: number) {
    setSelecionados((atual) => ({
      ...atual,
      [servicoId]: { ...atual[servicoId], valor },
    }));
  }

  async function gerar() {
    setEnviando(true);

    const itens = itensSelecionados.map((i) => ({
      servicoId: i.servico.id,
      quantidade: i.quantidade,
      valor: i.valor,
    }));

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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Edição */}
      <Card hoverable={false} className="p-5">
        {pacotes.length > 0 && (
          <div className="mb-5 border-b border-border pb-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Aplicar pacote</p>
            <div className="flex flex-wrap gap-2">
              {pacotes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => aplicarPacote(p)}
                  className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
        )}
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
                          ? "bg-accent text-white"
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

        {itensSelecionados.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {itensSelecionados.map(({ servico, quantidade, valor }) => (
              <div key={servico.id} className="rounded-xl bg-card/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text">{servico.nome}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) => mudarQuantidade(servico.id, parseInt(e.target.value) || 1)}
                      title="Quantidade"
                      className="h-8 w-14 rounded-lg border border-border bg-base px-2 text-center text-sm text-text"
                    />
                    <div className="w-28">
                      <CurrencyInput value={valor} onChange={(v) => mudarValor(servico.id, v)} />
                    </div>
                  </div>
                </div>

                {servico.nome === "Deslocamento" && (
                  <DeslocamentoCalc
                    valorAtual={valor}
                    onCalcular={(novoValor) => mudarValor(servico.id, novoValor)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-medium text-text">Total</span>
          <span className="text-lg font-medium text-accent">R$ {total.toFixed(0)}</span>
        </div>

        <Button
          onClick={gerar}
          disabled={enviando || itensSelecionados.length === 0}
          className="mt-4 w-full"
        >
          {enviando ? "Gerando..." : "Gerar página do orçamento"}
        </Button>
      </Card>

      {/* Preview ao vivo */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Preview em tempo real</p>
        <div className="rounded-2xl border border-white/[0.06] bg-[#09090B] p-6">
          <div className="mb-4">
            <img src="/logo.png" alt="Instaby" className="h-5 w-auto" />
          </div>

          <p className="text-2xl font-medium leading-tight text-[#F9FAFB]">gestão pensada</p>
          <p className="mb-3 text-2xl font-medium leading-tight text-[#E63946]">
            pra {clienteNome} crescer.
          </p>

          <p className="mb-3 mt-6 font-mono text-[10px] uppercase tracking-wide text-[#9CA3AF]">
            o que está incluso
          </p>

          {itensSelecionados.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">
              Selecione serviços ao lado pra ver a proposta ganhar forma aqui.
            </p>
          ) : (
            <div className="mb-5 flex flex-col gap-2">
              {itensSelecionados.map(({ servico, quantidade, valor }) => (
                <div key={servico.id} className="rounded-xl bg-[#111827] p-3.5">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-[#F9FAFB]">{servico.nome}</p>
                    <span className="text-sm font-medium text-[#E63946]">R$ {valor.toFixed(0)}</span>
                  </div>
                  {servico.descricao && (
                    <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">{servico.descricao}</p>
                  )}
                  {quantidade > 1 && (
                    <p className="mt-1 text-xs text-[#9CA3AF]">Quantidade: {quantidade}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {itensSelecionados.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="text-sm font-medium text-[#F9FAFB]">Total mensal</span>
              <span className="text-lg font-medium text-[#E63946]">R$ {total.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
