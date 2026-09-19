import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const item = await prisma.caseTrabalho.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.imagemUrl !== undefined && { imagemUrl: body.imagemUrl }),
      ...(body.imagemFoco !== undefined && { imagemFoco: body.imagemFoco }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.descricaoCompleta !== undefined && { descricaoCompleta: body.descricaoCompleta }),
      ...(body.botaoTexto !== undefined && { botaoTexto: body.botaoTexto }),
      ...(body.resultados !== undefined && { resultados: body.resultados }),
      ...(body.link !== undefined && { link: body.link }),
      ...(body.destaque !== undefined && { destaque: body.destaque }),
      ...(body.ordem !== undefined && { ordem: body.ordem }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.caseTrabalho.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
