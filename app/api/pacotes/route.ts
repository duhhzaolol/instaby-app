import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pacotes = await prisma.pacote.findMany({
    include: { itens: { include: { servico: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(pacotes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome || !body.itens || body.itens.length === 0) {
    return NextResponse.json({ erro: "Nome e ao menos um serviço são obrigatórios" }, { status: 400 });
  }

  const pacote = await prisma.pacote.create({
    data: {
      nome: body.nome,
      descricao: body.descricao || null,
      itens: {
        create: body.itens.map((i: { servicoId: string; quantidade: number }) => ({
          servicoId: i.servicoId,
          quantidade: i.quantidade || 1,
        })),
      },
    },
    include: { itens: { include: { servico: true } } },
  });

  return NextResponse.json(pacote, { status: 201 });
}
