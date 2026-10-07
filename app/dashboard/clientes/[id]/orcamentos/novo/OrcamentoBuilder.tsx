"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { EditorApresentacaoOrcamento } from "@/components/orcamentos/EditorApresentacaoOrcamento";
import { TopoOrcamento } from "@/components/orcamentos/TopoOrcamento";
import CondicoesOrcamento from "@/components/orcamentos/CondicoesOrcamento";
import { apresentacaoPadrao, obterApresentacaoOrcamento, validarApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";
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
  solicitacaoId,
  agencia = { nome: "Instaby", logoUrl: "/logo.png" },
}: {
  clienteId: string;
  clienteNome: string;
  agencia?: { nome: string; logoUrl: string };
  servicos: Servico[];
  pacotes: Pacote[];
  selecaoInicial?: { servicoId: string; quantidade: number }[];
  // Etapa 3 (v157) — presente quando essa tela foi aberta a partir do botão
  // "Preparar orçamento" de uma solicitação fora do escopo (ver
  // app/dashboard/clientes/[id]/orcamentos/novo/page.tsx). Só precisa viajar até
  // o POST — é o que deixa a rota vincular o orçamento de volta na solicitação.
  solicitacaoId?: string;
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
  const [erro, setErro] = useState("");
  const [apresentacao, setApresentacao] = useState(() => apresentacaoPadrao(clienteNome));
  const [tipoEscolhido, setTipoEscolhido] = useState(false);

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
  const apresentacaoAtual = {
    ...apresentacao,
    tipo: tipoEscolhido
      ? apresentacao.tipo
      : obterApresentacaoOrcamento(undefined, clienteNome, itensSelecionados.map((item) => item.servico.unidade)).tipo,
  };

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
    if (enviando || itensSelecionados.length === 0) return;
    const validacao = validarApresentacaoOrcamento(apresentacaoAtual);
    if (validacao.erro !== undefined) {
      setErro(validacao.erro);
      return;
    }
    setEnviando(true);
    setErro("");

    const itens = itensSelecionados.map((i) => ({
      servicoId: i.servico.id,
      quantidade: i.quantidade,
      valor: i.valor,
    }));

    try {
      const resposta = await fetch(`/api/clientes/${clienteId}/orcamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens, solicitacaoId, apresentacao: validacao.apresentacao }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        setErro(typeof dados?.erro === "string" ? dados.erro : "Não foi possível gerar o orçamento. Suas alterações foram mantidas; tente novamente.");
        return;
      }
      router.push(`/dashboard/clientes/${clienteId}?aba=orcamentos`);
      router.refresh();
    } catch {
      setErro("Não foi possível conectar para gerar o orçamento. Suas alterações foram mantidas; tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Edição */}
      <Card hoverable={false} className="min-w-0 p-5">
        <div className="mb-5 border-b border-border pb-5">
          <EditorApresentacaoOrcamento
            apresentacao={apresentacaoAtual}
            clienteNome={clienteNome}
            disabled={enviando}
            onChange={(valor, mudanca) => {
              setApresentacao(valor);
              if (mudanca?.tipoEscolhido) setTipoEscolhido(true);
              setErro("");
            }}
          />
        </div>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 break-words text-sm text-text">{servico.nome}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={quantidade}
                      onChange={(e) => mudarQuantidade(servico.id, parseInt(e.target.value) || 1)}
                      title="Quantidade"
                      aria-label={`Quantidade de ${servico.nome}`}
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
          <span className="text-lg font-medium text-accent">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </div>

        {erro && <p role="alert" className="mt-4 text-sm text-red-400">{erro}</p>}
        <Button
          onClick={gerar}
          disabled={enviando || itensSelecionados.length === 0}
          className="mt-4 w-full"
        >
          {enviando ? "Gerando..." : "Gerar página do orçamento"}
        </Button>
      </Card>

      {/* Preview ao vivo */}
      <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Prévia em tempo real</p>
        <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-[#09090B] p-5 sm:p-6">
          <div className="mb-4">
            <img src={agencia.logoUrl} alt={agencia.nome} className="h-5 w-auto max-w-48 object-contain" />
          </div>

          <TopoOrcamento apresentacao={apresentacaoAtual} compacto />

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
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <p className="min-w-0 break-words text-sm font-medium text-[#F9FAFB]">{servico.nome}</p>
                    <span className="shrink-0 text-sm font-medium text-[#E63946]">{valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                  {servico.descricao && (
                    <p className="mt-1 break-words text-xs leading-relaxed text-[#9CA3AF]">{servico.descricao}</p>
                  )}
                  {quantidade > 1 && (
                    <p className="mt-1 text-xs text-[#9CA3AF]">Quantidade: {quantidade}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {itensSelecionados.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
              <span className="text-sm font-medium text-[#F9FAFB]">{apresentacaoAtual.tipo === "mensal" ? "Total mensal" : "Total do serviço"}</span>
              <span className="text-lg font-medium text-[#E63946]">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          )}
          <CondicoesOrcamento condicoes={apresentacaoAtual.condicoes} variant="dark" className="mt-5" />
        </div>
      </div>
    </div>
  );
}
