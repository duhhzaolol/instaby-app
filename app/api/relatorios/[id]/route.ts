import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const relatorio = await prisma.relatorioPeriodo.update({
    where: { id: params.id },
    data: {
      ...(body.comentarioAgencia !== undefined && { comentarioAgencia: body.comentarioAgencia }),
      ...(body.comentarioCliente !== undefined && { comentarioCliente: body.comentarioCliente }),
    },
  });

  return NextResponse.json(relatorio);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.relatorioPeriodo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
