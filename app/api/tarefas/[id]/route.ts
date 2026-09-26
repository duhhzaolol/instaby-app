import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaSemana, temVideoBruto } from "@/lib/google";
import { CATEGORIAS_COM_PASTA_DRIVE, CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO } from "@/lib/categoriaTarefaVisual";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const existente = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (existente.clienteId && !(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  // Trava: uma tarefa de "Criar Reel" com pasta vinculada só sai de "A fazer"
  // quando já existe um arquivo de vídeo lá dentro (colocado pelo admin, direto
  // no Drive). Checado no servidor de propósito — não dá pra contornar só
  // escondendo o aviso na tela.
  if (
    body.status !== undefined &&
    body.status !== "a_fazer" &&
    existente.driveFolderId &&
    CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO.includes((existente.categoria || "") as any)
  ) {
    const temBruto = await temVideoBruto(existente.driveFolderId);
    if (!temBruto) {
      return NextResponse.json(
        { erro: "Essa tarefa ainda não tem o vídeo bruto na pasta do Drive dela — coloca o arquivo lá antes de avançar." },
        { status: 409 }
      );
    }
  }

  const tarefa = await prisma.tarefa.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.prazo !== undefined && { prazo: body.prazo ? new Date(body.prazo) : null }),
    },
  });

  // Categoria/prazo podem ter sido definidos só agora (tarefa criada sem prazo e
  // completada depois, por exemplo) — se ainda não tinha pasta, tenta criar.
  if (!tarefa.driveFolderId && tarefa.clienteId && tarefa.prazo && CATEGORIAS_COM_PASTA_DRIVE.includes((tarefa.categoria || "") as any)) {
    try {
      const driveFolderId = await garantirPastaSemana(tarefa.id);
      if (driveFolderId) (tarefa as any).driveFolderId = driveFolderId;
    } catch (e) {
      console.error("Erro ao preparar pasta do Drive pra essa tarefa:", e);
    }
  }

  return NextResponse.json(tarefa);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const existente = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (existente?.clienteId && !(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.tarefa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
