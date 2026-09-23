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
      cobrancaId: params.id,
      valor,
      data: body.data ? new Date(body.data) : new Date(),
    },
  });

  // se quitou o valor todo, já marca como pago pra manter compatibilidade com o resto do app
  const cobranca = await prisma.cobranca.findUnique({
    where: { id: params.id },
    include: { pagamentos: true },
  });
  if (cobranca) {
    const totalPago = cobranca.pagamentos.reduce((s, p) => s + Number(p.valor), 0);
    if (totalPago >= Number(cobranca.valor) && cobranca.status !== "pago") {
      await prisma.cobranca.update({ where: { id: params.id }, data: { status: "pago" } });
    }
  }

  return NextResponse.json(pagamento, { status: 201 });
}
