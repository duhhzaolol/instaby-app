import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.pacoteItem.deleteMany({ where: { pacoteId: params.id } });
  await prisma.pacote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const pacote = await prisma.pacote.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
    },
  });

  if (body.itens) {
    await prisma.pacoteItem.deleteMany({ where: { pacoteId: params.id } });
    await prisma.pacoteItem.createMany({
      data: body.itens.map((i: { servicoId: string; quantidade: number }) => ({
        pacoteId: params.id,
        servicoId: i.servicoId,
        quantidade: i.quantidade || 1,
      })),
    });
  }

  return NextResponse.json(pacote);
}
