import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const contratados = await prisma.servicoContratado.findMany({
    where: { clienteId: params.id, ativo: true },
    include: { servico: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(contratados);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (!body.servicoId || body.valor === undefined) {
    return NextResponse.json({ erro: "Serviço e valor são obrigatórios" }, { status: 400 });
  }

  const contratado = await prisma.servicoContratado.create({
    data: {
      clienteId: params.id,
      servicoId: body.servicoId,
      quantidade: body.quantidade || 1,
      valor: body.valor,
    },
    include: { servico: true },
  });

  return NextResponse.json(contratado, { status: 201 });
}
