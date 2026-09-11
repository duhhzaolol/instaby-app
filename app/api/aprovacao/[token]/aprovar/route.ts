import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await request.json().catch(() => ({}));

  const conteudo = await prisma.conteudo.findUnique({ where: { tokenAprovacao: params.token } });
  if (!conteudo) {
    return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  }

  const atualizado = await prisma.conteudo.update({
    where: { id: conteudo.id },
    data: {
      status: "aprovado",
      aprovadoEm: new Date(),
      aprovadoPor: body.nome || null,
    },
  });

  return NextResponse.json(atualizado);
}
