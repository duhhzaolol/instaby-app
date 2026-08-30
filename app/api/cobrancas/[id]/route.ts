import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const cobranca = await prisma.cobranca.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.valor !== undefined && { valor: body.valor }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.vencimento !== undefined && { vencimento: body.vencimento ? new Date(body.vencimento) : null }),
    },
  });

  return NextResponse.json(cobranca);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.cobranca.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
