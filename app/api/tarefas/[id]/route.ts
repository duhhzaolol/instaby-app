import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaSemana, temVideoBruto } from "@/lib/google";
import {
  CATEGORIAS_COM_PASTA_DRIVE,
  CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO,
  PRIORIDADES,
  visualDaCategoriaTarefa,
} from "@/lib/categoriaTarefaVisual";
import { STATUS_VALIDOS, statusFechaCronometro, statusLabel } from "@/lib/tarefas";
import { criarNotificacao } from "@/lib/notificacoes";

// Detalhe completo — alimenta o painel lateral (Etapa 1 v152): checklist,
// comentários internos, histórico de alterações e o cronômetro em aberto (se
// tiver), além dos dados básicos que já existiam espalhados pelas listas.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nome: true, cor: true } },
      responsavel: { select: { id: true, nome: true, fotoUrl: true } },
      bloqueioResponsavel: { select: { id: true, nome: true, fotoUrl: true } },
      checklist: { orderBy: { ordem: "asc" } },
      comentarios: { orderBy: { createdAt: "asc" }, include: { usuario: { select: { nome: true, fotoUrl: true } } } },
      historico: { orderBy: { createdAt: "desc" }, include: { usuario: { select: { nome: true } } } },
    },
  });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  // Cronômetro aberto vinculado a essa tarefa (se tiver) — é o que permite o painel
  // avisar "vai fechar o cronômetro em andamento" em vez de pedir hora manual de
  // novo (Etapa 1 item 9).
  const registroTempoAberto = await prisma.registroTempo.findFirst({
    where: { tarefaId: tarefa.id, fim: null },
    orderBy: { inicio: "desc" },
  });

  return NextResponse.json({ ...tarefa, registroTempoAberto });
}

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

  let novoResponsavelNome: string | null = null;
  if (body.responsavelId) {
    const responsavel = await prisma.usuario.findUnique({ where: { id: body.responsavelId } });
    if (!responsavel || !responsavel.ativo) {
      return NextResponse.json({ erro: "Essa pessoa não existe ou não está mais ativa." }, { status: 400 });
    }
    novoResponsavelNome = responsavel.nome;
  }

  if (body.status !== undefined && !STATUS_VALIDOS.includes(body.status)) {
    return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  }

  // Trava: uma tarefa de "Criar Reel" com pasta vinculada só sai de "A fazer" (pra
  // em_andamento/feito) quando já existe um arquivo de vídeo lá dentro. Bloquear
  // (ver abaixo) fica de fora dessa trava de propósito — a falta do bruto costuma
  // ser exatamente o MOTIVO do bloqueio, travar isso também não deixaria registrar
  // o problema.
  if (
    body.status !== undefined &&
    body.status !== "a_fazer" &&
    body.status !== "bloqueada" &&
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

  // concluidaEm segue o status sozinho — marca a hora exata em que virou "feito"
  // (pra dar pra contar "feitas essa semana" no Início) e limpa se voltar atrás
  // (reabriu por engano, cliente pediu ajuste etc.), nunca fica com data velha.
  const statusMudou = body.status !== undefined && body.status !== existente.status;
  let concluidaEm: Date | null | undefined = undefined;
  if (statusMudou) {
    if (body.status === "feito") concluidaEm = new Date();
    else if (existente.status === "feito") concluidaEm = null;
  }

  // Estado "Bloqueada" (Etapa 1 v152) — motivo obrigatório, responsável pelo
  // desbloqueio opcional. Sai de bloqueada -> os 3 campos somem sozinhos.
  const statusFinal = body.status !== undefined ? body.status : existente.status;
  let dadosBloqueio: {
    motivoBloqueio?: string | null;
    bloqueioResponsavelId?: string | null;
    bloqueadaEm?: Date | null;
  } = {};

  if (statusFinal === "bloqueada") {
    const motivo = (body.motivoBloqueio !== undefined ? body.motivoBloqueio : existente.motivoBloqueio) as
      | string
      | null
      | undefined;
    if (!motivo || !motivo.trim()) {
      return NextResponse.json({ erro: "Informe o motivo do bloqueio." }, { status: 400 });
    }
    const bloqueioResponsavelId =
      body.bloqueioResponsavelId !== undefined ? body.bloqueioResponsavelId || null : existente.bloqueioResponsavelId;
    if (bloqueioResponsavelId) {
      const pessoaBloqueio = await prisma.usuario.findUnique({ where: { id: bloqueioResponsavelId } });
      if (!pessoaBloqueio || !pessoaBloqueio.ativo) {
        return NextResponse.json({ erro: "Essa pessoa não existe ou não está mais ativa." }, { status: 400 });
      }
    }
    dadosBloqueio = {
      motivoBloqueio: motivo.trim(),
      bloqueioResponsavelId,
      bloqueadaEm: existente.status === "bloqueada" ? existente.bloqueadaEm : new Date(),
    };
  } else if (existente.status === "bloqueada") {
    dadosBloqueio = { motivoBloqueio: null, bloqueioResponsavelId: null, bloqueadaEm: null };
  }

  // Histórico de alterações (Etapa 1 v152) — uma linha por campo que realmente
  // mudou, calculada ANTES do update (compara contra o que já existia).
  type LinhaHistorico = { campo: string; valorAntigo: string | null; valorNovo: string | null };
  const historico: LinhaHistorico[] = [];

  if (body.titulo !== undefined && body.titulo !== existente.titulo) {
    historico.push({ campo: "titulo", valorAntigo: existente.titulo, valorNovo: body.titulo });
  }
  if (body.descricao !== undefined && (body.descricao || null) !== (existente.descricao || null)) {
    historico.push({ campo: "descricao", valorAntigo: existente.descricao || null, valorNovo: body.descricao || null });
  }
  if (body.responsavelId !== undefined && (body.responsavelId || null) !== (existente.responsavelId || null)) {
    const nomeAntigo = existente.responsavelId
      ? (await prisma.usuario.findUnique({ where: { id: existente.responsavelId }, select: { nome: true } }))?.nome ||
        null
      : null;
    historico.push({
      campo: "responsavel",
      valorAntigo: nomeAntigo || "Sem responsável",
      valorNovo: novoResponsavelNome || "Sem responsável",
    });
  }
  if (body.prioridade !== undefined && (body.prioridade || null) !== (existente.prioridade || null)) {
    historico.push({
      campo: "prioridade",
      valorAntigo: PRIORIDADES.find((p) => p.valor === existente.prioridade)?.label || "Nenhuma",
      valorNovo: PRIORIDADES.find((p) => p.valor === body.prioridade)?.label || "Nenhuma",
    });
  }
  if (body.prazo !== undefined) {
    const prazoNovoDate = body.prazo ? new Date(body.prazo) : null;
    const mudou = (prazoNovoDate?.getTime() ?? null) !== (existente.prazo?.getTime() ?? null);
    if (mudou) {
      historico.push({
        campo: "prazo",
        valorAntigo: existente.prazo ? existente.prazo.toLocaleString("pt-BR") : "Sem prazo",
        valorNovo: prazoNovoDate ? prazoNovoDate.toLocaleString("pt-BR") : "Sem prazo",
      });
    }
  }
  if (body.categoria !== undefined && (body.categoria || null) !== (existente.categoria || null)) {
    historico.push({
      campo: "categoria",
      valorAntigo: existente.categoria ? visualDaCategoriaTarefa(existente.categoria).label : "Sem categoria",
      valorNovo: body.categoria ? visualDaCategoriaTarefa(body.categoria).label : "Sem categoria",
    });
  }
  if (body.link !== undefined && (body.link || null) !== (existente.link || null)) {
    historico.push({ campo: "link", valorAntigo: existente.link || "Nenhum", valorNovo: body.link || "Nenhum" });
  }
  if (statusMudou) {
    historico.push({ campo: "status", valorAntigo: statusLabel(existente.status), valorNovo: statusLabel(statusFinal) });
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
      ...(body.link !== undefined && { link: body.link || null }),
      // "sem responsável" é um valor válido — manda null explícito pra tirar o
      // responsável de uma tarefa (não confundir com "undefined" de não mexer).
      ...(body.responsavelId !== undefined && { responsavelId: body.responsavelId || null }),
      ...(concluidaEm !== undefined && { concluidaEm }),
      ...dadosBloqueio,
    },
  });

  // Fecha sozinho qualquer cronômetro (RegistroTempo sem "fim") ligado a essa
  // tarefa quando ela sai de circulação (feito/bloqueada) — é isso que evita o
  // registro de horas órfão/duplicado pedido na Etapa 1 item 9, não importa qual
  // das telas disparou a mudança.
  let registroTempoFechado: { id: string } | null = null;
  if (statusMudou && statusFechaCronometro(statusFinal)) {
    const aberto = await prisma.registroTempo.findFirst({
      where: { tarefaId: tarefa.id, fim: null },
      orderBy: { inicio: "desc" },
    });
    if (aberto) {
      await prisma.registroTempo.update({ where: { id: aberto.id }, data: { fim: new Date() } });
      registroTempoFechado = { id: aberto.id };
    }
  }

  if (historico.length > 0) {
    await prisma.historicoTarefa.createMany({
      data: historico.map((h) => ({ tarefaId: tarefa.id, usuarioId: usuario.id, ...h })),
    });
  }

  // Notificações (Etapa 1 item 6) — nunca travam a resposta se falharem
  // (criarNotificacao já engole erro sozinho).
  if (body.responsavelId && body.responsavelId !== existente.responsavelId && body.responsavelId !== usuario.id) {
    await criarNotificacao({
      usuarioId: body.responsavelId,
      tipo: "tarefa_atribuida",
      titulo: `Nova tarefa atribuída: ${tarefa.titulo}`,
      tarefaId: tarefa.id,
      clienteId: tarefa.clienteId,
      link: `/dashboard?tarefa=${tarefa.id}`,
      criadaPorId: usuario.id,
    });
  }
  if (
    statusFinal === "bloqueada" &&
    dadosBloqueio.bloqueioResponsavelId &&
    dadosBloqueio.bloqueioResponsavelId !== existente.bloqueioResponsavelId &&
    dadosBloqueio.bloqueioResponsavelId !== usuario.id
  ) {
    await criarNotificacao({
      usuarioId: dadosBloqueio.bloqueioResponsavelId,
      tipo: "tarefa_bloqueada",
      titulo: `Tarefa bloqueada: ${tarefa.titulo}`,
      corpo: dadosBloqueio.motivoBloqueio || undefined,
      tarefaId: tarefa.id,
      clienteId: tarefa.clienteId,
      link: `/dashboard?tarefa=${tarefa.id}`,
      criadaPorId: usuario.id,
    });
  }

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

  return NextResponse.json({ ...tarefa, registroTempoFechado });
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
