import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const patrimonio = await prisma.patrimonio.findMany({
    orderBy: { data: "desc" },
    include: { despesaOrigem: true },
  });
  return NextResponse.json(patrimonio);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome || !body.valorAquisicao) {
    return NextResponse.json({ erro: "Nome e valor de aquisição são obrigatórios" }, { status: 400 });
  }

  const bem = await prisma.patrimonio.create({
    data: {
      nome: body.nome,
      categoria: body.categoria || null,
      valorAquisicao: body.valorAquisicao,
      valorAtual: body.valorAtual ?? body.valorAquisicao,
      data: body.data ? new Date(body.data) : new Date(),
      status: body.status || "em_uso",
    },
  });

  return NextResponse.json(bem, { status: 201 });
}
