import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const contratado = await prisma.servicoContratado.update({
    where: { id: params.id },
    data: {
      ...(body.quantidade !== undefined && { quantidade: body.quantidade }),
      ...(body.valor !== undefined && { valor: body.valor }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
    include: { servico: true },
  });

  return NextResponse.json(contratado);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.servicoContratado.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
