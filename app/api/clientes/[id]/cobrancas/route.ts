import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (!body.valor) {
    return NextResponse.json({ erro: "Valor é obrigatório" }, { status: 400 });
  }

  const cobranca = await prisma.cobranca.create({
    data: {
      clienteId: params.id,
      valor: parseFloat(body.valor),
      tipo: body.tipo || "recorrente",
      categoria: body.categoria || null,
      status: body.status || "pendente",
      vencimento: body.vencimento ? new Date(body.vencimento) : null,
      dataCompetencia: body.dataCompetencia ? new Date(body.dataCompetencia) : null,
      dataRecebimento: body.status === "pago" && body.data ? new Date(body.data) : null,
      createdAt: body.data ? new Date(body.data) : undefined,
    },
  });

  return NextResponse.json(cobranca, { status: 201 });
}
