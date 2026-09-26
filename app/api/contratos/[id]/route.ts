import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verContratos");
  if (erro) return erro;

  const body = await request.json();

  const contrato = await prisma.contrato.update({
    where: { id: params.id },
    data: {
      ...(body.conteudo !== undefined && { conteudo: body.conteudo }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.arquivoUrl !== undefined && { arquivoUrl: body.arquivoUrl }),
    },
  });

  return NextResponse.json(contrato);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verContratos");
  if (erro) return erro;

  await prisma.contrato.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
