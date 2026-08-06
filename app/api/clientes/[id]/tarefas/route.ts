import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      clienteId: params.id,
      titulo: body.titulo,
      tipo: body.tipo || "tarefa",
      link: body.link || null,
    },
  });

  return NextResponse.json(tarefa, { status: 201 });
}
