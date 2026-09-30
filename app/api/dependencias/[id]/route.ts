import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";

// Remove um vínculo de dependência entre tarefas (Etapa 4 v158) — rota própria por
// id do VÍNCULO, não aninhada em /tarefas/[id]/, mesmo espírito de
// app/api/checklist/[id]/route.ts: quem chama (painel lateral da tarefa) já sabe o
// id do vínculo, não precisa saber de qual tarefa ele "pertence" pra apagar.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dependencia = await prisma.dependenciaTarefa.findUnique({
    where: { id: params.id },
    include: { tarefa: { select: { clienteId: true } } },
  });
  if (!dependencia) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (dependencia.tarefa.clienteId && !(await podeVerCliente(usuario, dependencia.tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.dependenciaTarefa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
