import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;

  const body = await request.json();

  const cobranca = await prisma.cobranca.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.valor !== undefined && { valor: body.valor }),
      ...(body.tipo !== undefined && { tipo: body.tipo }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.vencimento !== undefined && { vencimento: body.vencimento ? new Date(body.vencimento) : null }),
      ...(body.dataCompetencia !== undefined && {
        dataCompetencia: body.dataCompetencia ? new Date(body.dataCompetencia) : null,
      }),
      ...(body.dataRecebimento !== undefined && {
        dataRecebimento: body.dataRecebimento ? new Date(body.dataRecebimento) : null,
      }),
    },
  });

  return NextResponse.json(cobranca);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;

  await prisma.cobranca.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
