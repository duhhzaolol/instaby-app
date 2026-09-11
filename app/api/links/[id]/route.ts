import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  try {
    const link = await prisma.linkCliente.update({
      where: { id: params.id },
      data: {
        ...(body.tipo !== undefined && { tipo: body.tipo }),
        ...(body.label !== undefined && { label: body.label || null }),
        ...(body.url !== undefined && { url: body.url }),
      },
    });
    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ erro: "Não deu pra atualizar esse link." }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.linkCliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
