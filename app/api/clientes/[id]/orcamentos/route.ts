import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarSlug } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orcamentos = await prisma.orcamento.findMany({
    where: { clienteId: params.id },
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orcamentos);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  // body.itens = [{ servicoId, quantidade, valor }]

  if (!body.itens || body.itens.length === 0) {
    return NextResponse.json({ erro: "Selecione ao menos um serviço" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId: params.id,
      slug: gerarSlug(cliente.nome),
      status: "pendente",
      enviadoEm: new Date(),
      itens: {
        create: body.itens.map((item: { servicoId: string; quantidade: number; valor: number }) => ({
          servicoId: item.servicoId,
          quantidade: item.quantidade,
          valor: item.valor,
        })),
      },
    },
    include: { itens: true },
  });

  return NextResponse.json(orcamento, { status: 201 });
}
