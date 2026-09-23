import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;

  const body = await request.json();
  const valor = Number(body.valor);
  if (!valor || valor <= 0) {
    return NextResponse.json({ erro: "Informe um valor válido" }, { status: 400 });
  }

  const pagamento = await prisma.pagamento.create({
    data: {
      despesaId: params.id,
      valor,
      data: body.data ? new Date(body.data) : new Date(),
    },
  });

  const despesa = await prisma.despesa.findUnique({
    where: { id: params.id },
    include: { pagamentos: true },
  });
  if (despesa) {
    const totalPago = despesa.pagamentos.reduce((s, p) => s + Number(p.valor), 0);
    if (totalPago >= Number(despesa.valor) && despesa.status !== "pago") {
      await prisma.despesa.update({ where: { id: params.id }, data: { status: "pago" } });
    }
  }

  return NextResponse.json(pagamento, { status: 201 });
}
