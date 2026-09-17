import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const item = await prisma.linkBio.update({
    where: { id: params.id },
    data: {
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.imagemUrl !== undefined && { imagemUrl: body.imagemUrl }),
      ...(body.ordem !== undefined && { ordem: body.ordem }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.linkBio.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
