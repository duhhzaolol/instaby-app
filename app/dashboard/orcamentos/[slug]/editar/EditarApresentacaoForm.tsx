"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EditorApresentacaoOrcamento } from "@/components/orcamentos/EditorApresentacaoOrcamento";
import { TopoOrcamento } from "@/components/orcamentos/TopoOrcamento";
import CondicoesOrcamento from "@/components/orcamentos/CondicoesOrcamento";
import { BaixarPdfOrcamento } from "@/components/orcamentos/BaixarPdfOrcamento";
import { validarApresentacaoOrcamento, type ApresentacaoOrcamento } from "@/lib/apresentacaoOrcamento";

type Item = { id: string; nome: string; descricao: string; quantidade: number; valor: number };

export default function EditarApresentacaoForm({
  slug,
  clienteNome,
  apresentacaoInicial,
  aceito,
  itens,
  agencia = { nome: "Instaby", logoUrl: "/logo.png" },
}: {
  slug: string;
  clienteNome: string;
  apresentacaoInicial: ApresentacaoOrcamento;
  aceito: boolean;
  itens: Item[];
  agencia?: { nome: string; logoUrl: string };
}) {
  const [apresentacao, setApresentacao] = useState(apresentacaoInicial);
  const [apresentacaoSalva, setApresentacaoSalva] = useState(apresentacaoInicial);
  const [salvando, setSalvando] = useState(false);
  const [bloqueado, setBloqueado] = useState(aceito);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const alterado = JSON.stringify(apresentacao) !== JSON.stringify(apresentacaoSalva);
  const total = itens.reduce((soma, item) => soma + item.valor, 0);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando || bloqueado) return;
    const validacao = validarApresentacaoOrcamento(apresentacao);
    if (validacao.erro !== undefined) {
      setErro(validacao.erro);
      return;
    }
    setSalvando(true);
    setErro("");
    setSalvo(false);
    try {
      const resposta = await fetch(`/api/orcamento/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apresentacao: validacao.apresentacao }),
      });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        if (resposta.status === 409) setBloqueado(true);
        setErro(typeof dados?.erro === "string" ? dados.erro : "Não foi possível salvar. Suas alterações foram mantidas; tente novamente.");
        return;
      }
      const retorno = validarApresentacaoOrcamento(dados?.apresentacao);
      const atualizada = retorno.apresentacao ?? validacao.apresentacao;
      setApresentacao(atualizada);
      setApresentacaoSalva(atualizada);
      setSalvo(true);
    } catch {
      setErro("Não foi possível conectar para salvar. Suas alterações foram mantidas; tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
      <Card hoverable={false} className="min-w-0 p-5">
        {aceito ? (
          <p className="text-sm leading-relaxed text-muted">
            Este orçamento já foi aceito. A apresentação e as condições estão preservadas e não podem ser alteradas.
          </p>
        ) : (
          <form onSubmit={salvar}>
            <EditorApresentacaoOrcamento
              apresentacao={apresentacao}
              clienteNome={clienteNome}
              disabled={salvando || bloqueado}
              onChange={(valor) => {
                setApresentacao(valor);
                setSalvo(false);
                setErro("");
              }}
            />
            {erro && <p role="alert" className="mt-4 text-sm text-red-400">{erro}</p>}
            {salvo && <p role="status" className="mt-4 text-sm text-emerald-400">Alterações salvas no mesmo link do orçamento.</p>}
            {alterado && !salvando && !bloqueado && <p className="mt-4 text-xs text-muted">Você tem alterações ainda não salvas.</p>}
            <Button type="submit" disabled={salvando || bloqueado || !alterado} className="mt-4 w-full">
              {salvando ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        )}
        <BaixarPdfOrcamento slug={slug} disabled={alterado || salvando} className="mt-4" />
        {alterado && <p className="mt-2 text-xs text-muted">Salve a apresentação e as condições para incluí-las no PDF.</p>}
        <a
          href={`/orcamento/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm text-accent hover:underline"
        >
          Abrir orçamento em nova aba
        </a>
        {!aceito && <p className="mt-1 text-xs text-muted">A nova aba mostra a última versão salva.</p>}
      </Card>

      <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Prévia do orçamento</p>
        <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-[#09090B] p-5 sm:p-6">
          <div className="mb-4"><img src={agencia.logoUrl} alt={agencia.nome} className="h-5 w-auto max-w-48 object-contain" /></div>
          <TopoOrcamento apresentacao={apresentacao} compacto />
          <p className="mb-3 mt-6 font-mono text-[10px] uppercase tracking-wide text-[#9CA3AF]">o que está incluso</p>
          <div className="mb-5 flex flex-col gap-2">
            {itens.map((item) => (
              <div key={item.id} className="min-w-0 rounded-xl bg-[#111827] p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <p className="min-w-0 break-words text-sm font-medium text-[#F9FAFB]">{item.nome}</p>
                  <span className="shrink-0 text-sm font-medium text-[#E63946]">{item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
                {item.descricao && <p className="mt-1 break-words text-xs leading-relaxed text-[#9CA3AF]">{item.descricao}</p>}
                {item.quantidade > 1 && <p className="mt-1 text-xs text-[#9CA3AF]">Quantidade: {item.quantidade}</p>}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
            <span className="text-sm font-medium text-[#F9FAFB]">{apresentacao.tipo === "mensal" ? "Total mensal" : "Total do serviço"}</span>
            <span className="text-lg font-medium text-[#E63946]">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
          <CondicoesOrcamento condicoes={apresentacao.condicoes} variant="dark" className="mt-5" />
        </div>
      </div>
    </div>
  );
}
