import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const registro = await prisma.registroTempo.update({
    where: { id: params.id },
    data: {
      ...(body.atividade !== undefined && { atividade: body.atividade }),
      ...(body.clienteId !== undefined && { clienteId: body.clienteId || null }),
      ...(body.inicio !== undefined && { inicio: new Date(body.inicio) }),
      ...(body.fim !== undefined && { fim: body.fim ? new Date(body.fim) : null }),
    },
    include: { cliente: { select: { nome: true } } },
  });

  return NextResponse.json(registro);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.registroTempo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
