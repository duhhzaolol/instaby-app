import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, clienteIdsPermitidos, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaSemana } from "@/lib/google";
import { CATEGORIAS_COM_PASTA_DRIVE } from "@/lib/categoriaTarefaVisual";

export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const idsPermitidos = await clienteIdsPermitidos(usuario);

  const tarefas = await prisma.tarefa.findMany({
    where: idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : undefined,
    include: { cliente: { select: { nome: true, cor: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tarefas);
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await request.json();

  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }
  if (body.clienteId && !(await podeVerCliente(usuario, body.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      titulo: body.titulo,
      tipo: body.tipo || "tarefa",
      categoria: body.categoria || null,
      descricao: body.descricao || null,
      prioridade: body.prioridade || null,
      clienteId: body.clienteId || null,
      link: body.link || null,
      prazo: body.prazo ? new Date(body.prazo) : null,
    },
  });

  // Sob demanda: só tenta criar a pasta da semana se for categoria de mídia com
  // prazo e cliente definidos. Best-effort — se o Drive falhar, a tarefa já foi
  // criada normalmente, só fica sem pasta vinculada (tenta de novo numa próxima
  // edição, ver PATCH de /api/tarefas/[id]).
  if (tarefa.clienteId && tarefa.prazo && CATEGORIAS_COM_PASTA_DRIVE.includes((tarefa.categoria || "") as any)) {
    try {
      const driveFolderId = await garantirPastaSemana(tarefa.id);
      if (driveFolderId) (tarefa as any).driveFolderId = driveFolderId;
    } catch (e) {
      console.error("Erro ao preparar pasta do Drive pra essa tarefa:", e);
    }
  }

  return NextResponse.json(tarefa, { status: 201 });
}
