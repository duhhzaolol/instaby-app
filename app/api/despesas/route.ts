import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const despesas = await prisma.despesa.findMany({
    orderBy: { data: "desc" },
    include: { cliente: true },
    take: 50,
  });
  return NextResponse.json(despesas);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.descricao || !body.valor) {
    return NextResponse.json({ erro: "Descrição e valor são obrigatórios" }, { status: 400 });
  }

  const despesa = await prisma.despesa.create({
    data: {
      descricao: body.descricao,
      valor: body.valor,
      clienteId: body.clienteId || null,
      tipo: body.tipo || "flexivel",
      data: body.data ? new Date(body.data) : new Date(),
    },
  });

  return NextResponse.json(despesa, { status: 201 });
}
