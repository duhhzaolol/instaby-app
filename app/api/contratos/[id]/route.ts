import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const contrato = await prisma.contrato.update({
    where: { id: params.id },
    data: {
      ...(body.conteudo !== undefined && { conteudo: body.conteudo }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(contrato);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.contrato.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
