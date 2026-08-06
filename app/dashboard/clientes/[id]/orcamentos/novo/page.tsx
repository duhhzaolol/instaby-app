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
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) notFound();

  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  return (
    <div>
      <Link
        href={`/dashboard/clientes/${cliente.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      >
        <ArrowLeft size={13} /> {cliente.nome}
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Novo orçamento — {cliente.nome}</p>
      <p className="mb-5 text-sm text-muted">Selecione os serviços do catálogo — a página vai ganhando forma ao lado</p>

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
        />
      )}
    </div>
  );
}
