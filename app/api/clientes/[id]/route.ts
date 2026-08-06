import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { tarefas: { orderBy: { createdAt: "desc" } } },
  });

  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      nome: body.nome,
      whatsapp: body.whatsapp,
      status: body.status,
    },
  });

  return NextResponse.json(cliente);
}
