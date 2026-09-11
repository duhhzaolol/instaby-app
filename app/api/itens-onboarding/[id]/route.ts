import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const item = await prisma.itemOnboarding.update({
    where: { id: params.id },
    data: {
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.responsavel !== undefined && { responsavel: body.responsavel }),
      ...(body.observacao !== undefined && { observacao: body.observacao || null }),
      ...(body.status !== undefined && {
        status: body.status,
        dataConclusao: body.status === "concluido" ? new Date() : null,
      }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.itemOnboarding.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
