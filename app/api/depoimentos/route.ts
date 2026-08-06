import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const depoimentos = await prisma.depoimento.findMany({
    where: { ativo: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(depoimentos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nomeCliente || !body.texto) {
    return NextResponse.json({ erro: "Nome e texto são obrigatórios" }, { status: 400 });
  }

  const depoimento = await prisma.depoimento.create({
    data: { nomeCliente: body.nomeCliente, texto: body.texto },
  });

  return NextResponse.json(depoimento, { status: 201 });
}
