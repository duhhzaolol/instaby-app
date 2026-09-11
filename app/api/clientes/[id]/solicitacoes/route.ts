import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  if (!body.descricao) {
    return NextResponse.json({ erro: "Descrição é obrigatória" }, { status: 400 });
  }

  const solicitacao = await prisma.solicitacao.create({
    data: {
      clienteId: params.id,
      descricao: body.descricao,
      prioridade: body.prioridade || "media",
      extra: !!body.extra,
    },
  });

  return NextResponse.json(solicitacao, { status: 201 });
}
