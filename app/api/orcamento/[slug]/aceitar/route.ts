import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const orcamento = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    include: { itens: true },
  });

  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }

  const total = orcamento.itens.reduce((soma, item) => soma + Number(item.valor), 0);

  const [orcamentoAtualizado] = await prisma.$transaction([
    prisma.orcamento.update({
      where: { id: orcamento.id },
      data: { status: "aceito" },
    }),
    prisma.cobranca.create({
      data: {
        clienteId: orcamento.clienteId,
        orcamentoId: orcamento.id,
        valor: total,
        tipo: "recorrente",
        status: "pendente",
      },
    }),
    prisma.cliente.update({
      where: { id: orcamento.clienteId },
      data: { status: "ativo" },
    }),
  ]);

  return NextResponse.json(orcamentoAtualizado);
}
