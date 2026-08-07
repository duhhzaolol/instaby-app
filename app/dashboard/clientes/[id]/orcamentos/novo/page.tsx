import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import OrcamentoBuilder from "./OrcamentoBuilder";

export default async function NovoOrcamentoPage({
  params,
}: {
  params: { id: string };
}) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { servicosContratados: { where: { ativo: true } } },
  });
  if (!cliente) notFound();

  const [servicos, pacotes] = await Promise.all([
    prisma.servico.findMany({ orderBy: [{ categoria: "asc" }, { nome: "asc" }] }),
    prisma.pacote.findMany({ include: { itens: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <Link
        href={`/dashboard/clientes/${cliente.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      >
        <ArrowLeft size={13} /> {cliente.nome}
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Novo orçamento — {cliente.nome}</p>
      <p className="mb-5 text-sm text-muted">
        {cliente.servicosContratados.length > 0
          ? "Já veio com os serviços contratados dele marcados — ajuste se precisar"
          : "Selecione os serviços do catálogo — a página vai ganhando forma ao lado"}
      </p>

      {servicos.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum serviço no catálogo ainda.{" "}
          <Link href="/dashboard/servicos/novo" className="text-accent">
            Cadastre um serviço primeiro
          </Link>
          .
        </p>
      ) : (
        <OrcamentoBuilder
          clienteId={cliente.id}
          clienteNome={cliente.nome}
          servicos={servicos.map((s) => ({ ...s, valorUnitario: Number(s.valorUnitario) }))}
          pacotes={pacotes.map((p) => ({
            id: p.id,
            nome: p.nome,
            itens: p.itens.map((i) => ({ servicoId: i.servicoId, quantidade: i.quantidade })),
          }))}
          selecaoInicial={cliente.servicosContratados.map((sc) => ({
            servicoId: sc.servicoId,
            quantidade: sc.quantidade,
          }))}
        />
      )}
    </div>
  );
}
