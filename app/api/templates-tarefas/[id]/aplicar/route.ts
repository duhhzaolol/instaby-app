import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const template = await prisma.templateTarefas.findUnique({ where: { id: params.id } });
  if (!template) {
    return NextResponse.json({ erro: "Template não encontrado" }, { status: 404 });
  }

  await prisma.tarefa.createMany({
    data: template.itens.map((titulo) => ({
      titulo,
      clienteId: body.clienteId || null,
      conteudoId: body.conteudoId || null,
    })),
  });

  return NextResponse.json({ ok: true, criadas: template.itens.length });
}
