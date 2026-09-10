import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const clienteId = request.nextUrl.searchParams.get("clienteId");
  const status = request.nextUrl.searchParams.get("status");

  const conteudos = await prisma.conteudo.findMany({
    where: {
      ...(clienteId && { clienteId }),
      ...(status && { status }),
    },
    include: { cliente: { select: { nome: true, cor: true } }, tarefas: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(conteudos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }

  const conteudo = await prisma.conteudo.create({
    data: {
      clienteId: body.clienteId || null,
      titulo: body.titulo,
      campanha: body.campanha || null,
      formato: body.formato || null,
      objetivo: body.objetivo || null,
      pilar: body.pilar || null,
      redes: body.redes || [],
      tipoVeiculacao: body.tipoVeiculacao || "organico",
      briefing: body.briefing || null,
      roteiro: body.roteiro || null,
      legenda: body.legenda || null,
      cta: body.cta || null,
      referencias: body.referencias || null,
      linkArquivos: body.linkArquivos || null,
      dataCaptacao: body.dataCaptacao ? new Date(body.dataCaptacao) : null,
      prazoEdicao: body.prazoEdicao ? new Date(body.prazoEdicao) : null,
      prazoAprovacao: body.prazoAprovacao ? new Date(body.prazoAprovacao) : null,
      dataPublicacao: body.dataPublicacao ? new Date(body.dataPublicacao) : null,
      status: body.status || "ideia",
    },
  });

  return NextResponse.json(conteudo, { status: 201 });
}
