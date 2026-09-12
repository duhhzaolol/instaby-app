import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const template = await prisma.templateTarefas.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.itens !== undefined && { itens: body.itens }),
    },
  });
  return NextResponse.json(template);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.templateTarefas.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
