import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const solicitacao = await prisma.solicitacao.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
      ...(body.extra !== undefined && { extra: body.extra }),
    },
  });
  return NextResponse.json(solicitacao);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.solicitacao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
