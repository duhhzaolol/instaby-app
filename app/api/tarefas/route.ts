import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tarefas = await prisma.tarefa.findMany({
    include: { cliente: { select: { nome: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tarefas);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      titulo: body.titulo,
      tipo: body.tipo || "tarefa",
      clienteId: body.clienteId || null,
      link: body.link || null,
    },
  });

  return NextResponse.json(tarefa, { status: 201 });
}
