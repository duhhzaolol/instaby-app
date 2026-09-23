import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;

  await prisma.pagamento.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
