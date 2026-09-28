import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";

// Adiciona um sub-passo dentro de uma tarefa (redesign v144, Parte 2) — usado no
// "Fazendo agora" do Início do Editor. Ver Tarefa.checklist no schema.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.titulo || !String(body.titulo).trim()) {
    return NextResponse.json({ erro: "Digite o que precisa ser feito" }, { status: 400 });
  }

  const ultimo = await prisma.checklistItemTarefa.findFirst({
    where: { tarefaId: tarefa.id },
    orderBy: { ordem: "desc" },
  });

  const item = await prisma.checklistItemTarefa.create({
    data: {
      tarefaId: tarefa.id,
      titulo: String(body.titulo).trim(),
      ordem: (ultimo?.ordem ?? -1) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
