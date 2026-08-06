import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const servico = await prisma.servico.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.unidade !== undefined && { unidade: body.unidade }),
      ...(body.valorUnitario !== undefined && { valorUnitario: body.valorUnitario }),
    },
  });

  return NextResponse.json(servico);
}
