import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, clienteIdsPermitidos, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaTarefa } from "@/lib/google";
import { CATEGORIAS_COM_PASTA_DRIVE } from "@/lib/categoriaTarefaVisual";
import { dataIsoValida, dataIsoParaDate } from "@/lib/midiaRevisao";
import { ehPlanejamento, tipoTrabalhoValido } from "@/lib/organizacaoTarefas";

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

  if (body.tipo !== undefined && !tipoTrabalhoValido(body.tipo)) {
    return NextResponse.json({ erro: "Escolha Planejamento ou Produção." }, { status: 400 });
  }

  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }
  if (body.clienteId && !(await podeVerCliente(usuario, body.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (body.responsavelId) {
    const responsavel = await prisma.usuario.findUnique({ where: { id: body.responsavelId }, select: { ativo: true } });
    if (!responsavel?.ativo) return NextResponse.json({ erro: "Essa pessoa não existe ou não está mais ativa." }, { status: 400 });
  }
  for (const [campo, label] of [["prazo", "Prazo de produção"], ["publicacaoSugeridaEm", "Dia planejado de postagem"]]) {
    if (body[campo] !== undefined && body[campo] !== null && body[campo] !== "" && !dataIsoValida(body[campo])) {
      return NextResponse.json({ erro: `${label} inválido.` }, { status: 400 });
    }
  }

  const tarefa = await prisma.tarefa.create({
    data: {
      titulo: body.titulo,
      tipo: body.tipo || "tarefa",
      categoria: body.categoria || null,
      descricao: body.descricao || null,
      prioridade: body.prioridade || "media",
      responsavelId: body.responsavelId || null,
      clienteId: body.clienteId || null,
      link: body.link || null,
      prazo: body.prazo ? dataIsoParaDate(body.prazo) : null,
      publicacaoSugeridaEm: body.publicacaoSugeridaEm ? dataIsoParaDate(body.publicacaoSugeridaEm) : null,
    },
  });

  // Checklist inicial (opcional) — vem de um preset escolhido na hora de criar
  // (ex: "Básico") ou digitado na mão, item por item (redesign v144, Parte 3).
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

  // Sob demanda: só tenta criar a pasta própria da tarefa (dentro da pasta da
  // semana) se for categoria de mídia com prazo e cliente definidos. Best-effort —
  // se o Drive falhar, a tarefa já foi criada normalmente, só fica sem pasta
  // vinculada (tenta de novo numa próxima edição, ver PATCH de /api/tarefas/[id]).
  if (!ehPlanejamento(tarefa) && tarefa.clienteId && tarefa.prazo && CATEGORIAS_COM_PASTA_DRIVE.includes((tarefa.categoria || "") as any)) {
    try {
      const driveFolderId = await garantirPastaTarefa(tarefa.id);
      if (driveFolderId) (tarefa as any).driveFolderId = driveFolderId;
    } catch (e) {
      console.error("Erro ao preparar pasta do Drive pra essa tarefa:", e);
    }
  }

  return NextResponse.json(tarefa, { status: 201 });
}
