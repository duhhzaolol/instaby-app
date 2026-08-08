import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const tarefa = await prisma.tarefa.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.prazo !== undefined && { prazo: body.prazo ? new Date(body.prazo) : null }),
    },
  });

  return NextResponse.json(tarefa);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.tarefa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
