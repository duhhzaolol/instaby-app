import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const clientes = await prisma.cliente.findMany({
    where: status && status !== "todos" ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome: body.nome,
      whatsapp: body.whatsapp || null,
      status: body.status || "lead",
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
