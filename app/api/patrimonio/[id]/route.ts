import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.categoria !== undefined) data.categoria = body.categoria;
  if (body.valorAtual !== undefined) data.valorAtual = body.valorAtual;
  if (body.status !== undefined) data.status = body.status;

  const bem = await prisma.patrimonio.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(bem);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.patrimonio.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
