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
      categoria: body.categoria || null,
      link: body.link || null,
      prazo: body.prazo ? new Date(body.prazo) : null,
    },
  });

  // Checklist inicial (opcional) — mesmo mecanismo de /api/tarefas (preset ou
  // digitado na mão, redesign v144 Parte 3).
  if (Array.isArray(body.checklistItens) && body.checklistItens.length > 0) {
    const itensValidos: string[] = body.checklistItens
      .filter((i: unknown): i is string => typeof i === "string" && i.trim().length > 0)
      .map((i: string) => i.trim());
    if (itensValidos.length > 0) {
      await prisma.checklistItemTarefa.createMany({
        data: itensValidos.map((titulo, ordem) => ({ tarefaId: tarefa.id, titulo, ordem })),
      });
    }
  }

  return NextResponse.json(tarefa, { status: 201 });
}
