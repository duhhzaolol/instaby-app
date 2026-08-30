import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const despesa = await prisma.despesa.update({
    where: { id: params.id },
    data: {
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.valor !== undefined && { valor: body.valor }),
      ...(body.data !== undefined && { data: new Date(body.data) }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.categoriaFinanceira !== undefined && { categoriaFinanceira: body.categoriaFinanceira }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.subcategoria !== undefined && { subcategoria: body.subcategoria }),
    },
  });

  return NextResponse.json(despesa);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.despesa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
