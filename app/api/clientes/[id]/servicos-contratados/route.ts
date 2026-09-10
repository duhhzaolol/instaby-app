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

  if (!body.servicoId || typeof body.valor !== "number" || isNaN(body.valor)) {
    return NextResponse.json({ erro: "Serviço e um valor numérico válido são obrigatórios" }, { status: 400 });
  }

  try {
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
  } catch {
    return NextResponse.json(
      { erro: "Não deu pra adicionar esse serviço — confere se ele ainda existe no catálogo e tem um valor válido." },
      { status: 400 }
    );
  }
}
