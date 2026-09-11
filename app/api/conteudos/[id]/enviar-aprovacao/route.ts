import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const conteudo = await prisma.conteudo.findUnique({ where: { id: params.id } });
  if (!conteudo) {
    return NextResponse.json({ erro: "Conteúdo não encontrado" }, { status: 404 });
  }

  const token = conteudo.tokenAprovacao || randomBytes(8).toString("hex");

  const atualizado = await prisma.conteudo.update({
    where: { id: params.id },
    data: {
      tokenAprovacao: token,
      status: "aguardando_aprovacao",
      enviadoAprovacaoEm: new Date(),
      comentarioAprovacao: null, // limpa comentário de uma rodada anterior
    },
  });

  return NextResponse.json(atualizado);
}
