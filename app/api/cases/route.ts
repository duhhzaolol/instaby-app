import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cases = await prisma.caseTrabalho.findMany({ orderBy: { ordem: "asc" } });
  return NextResponse.json(cases);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  const maiorOrdem = await prisma.caseTrabalho.aggregate({ _max: { ordem: true } });

  const item = await prisma.caseTrabalho.create({
    data: {
      nome: body.nome,
      categoria: body.categoria || null,
      imagemUrl: body.imagemUrl || null,
      link: body.link || null,
      destaque: body.destaque || false,
      ordem: (maiorOrdem._max.ordem ?? -1) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
