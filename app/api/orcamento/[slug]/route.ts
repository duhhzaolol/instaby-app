import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const orcamento = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    include: {
      cliente: true,
      itens: { include: { servico: true } },
    },
  });

  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(orcamento);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const orcamento = await prisma.orcamento.findUnique({ where: { slug: params.slug } });
  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.itemOrcamento.deleteMany({ where: { orcamentoId: orcamento.id } }),
    prisma.contrato.updateMany({ where: { orcamentoId: orcamento.id }, data: { orcamentoId: null } }),
    prisma.cobranca.updateMany({ where: { orcamentoId: orcamento.id }, data: { orcamentoId: null } }),
    prisma.orcamento.delete({ where: { id: orcamento.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
