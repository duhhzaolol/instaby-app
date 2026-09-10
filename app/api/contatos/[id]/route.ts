import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const contato = await prisma.contato.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.cargo !== undefined && { cargo: body.cargo || null }),
      ...(body.telefone !== undefined && { telefone: body.telefone || null }),
      ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp || null }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes || null }),
      ...(body.principal !== undefined && { principal: body.principal }),
      ...(body.financeiro !== undefined && { financeiro: body.financeiro }),
      ...(body.aprovacaoConteudo !== undefined && { aprovacaoConteudo: body.aprovacaoConteudo }),
      ...(body.contratos !== undefined && { contratos: body.contratos }),
    },
  });

  return NextResponse.json(contato);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.contato.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
