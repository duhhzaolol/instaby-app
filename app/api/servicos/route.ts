import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(servicos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome || !body.valorUnitario) {
    return NextResponse.json({ erro: "Nome e valor são obrigatórios" }, { status: 400 });
  }

  const servico = await prisma.servico.create({
    data: {
      nome: body.nome,
      descricao: body.descricao || "",
      categoria: body.categoria || "Outros",
      unidade: body.unidade || "mês",
      valorUnitario: body.valorUnitario,
      clausulaContrato: body.clausulaContrato || null,
    },
  });

  return NextResponse.json(servico, { status: 201 });
}
