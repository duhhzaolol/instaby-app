import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="min-h-screen bg-base px-6 py-8">
      <Link href={`/dashboard/clientes/${cliente.id}`} className="text-xs text-muted">
        ← {cliente.nome}
      </Link>

      <p className="mb-1 mt-3 text-base font-medium text-white">Novo orçamento — {cliente.nome}</p>
      <p className="mb-5 text-xs text-muted">Selecione os serviços do catálogo</p>

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
