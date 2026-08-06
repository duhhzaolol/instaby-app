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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.servico.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { erro: "Esse serviço já foi usado num orçamento ou pacote, não dá pra excluir. Edite o valor em vez disso." },
      { status: 400 }
    );
  }
}
