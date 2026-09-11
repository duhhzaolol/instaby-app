import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const oportunidades = await prisma.oportunidade.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(oportunidades);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.nome) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  const oportunidade = await prisma.oportunidade.create({
    data: {
      nome: body.nome,
      contatoNome: body.contatoNome || null,
      contatoWhatsapp: body.contatoWhatsapp || null,
      origem: body.origem || null,
      interesse: body.interesse || null,
      valorEstimado: body.valorEstimado || null,
      proximaAcao: body.proximaAcao || null,
      dataProximaAcao: body.dataProximaAcao ? new Date(body.dataProximaAcao) : null,
    },
  });

  return NextResponse.json(oportunidade, { status: 201 });
}
