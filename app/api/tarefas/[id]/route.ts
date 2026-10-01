import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaTarefa, verificarVideoBrutoNoDrive } from "@/lib/google";
import {
  CATEGORIAS_COM_PASTA_DRIVE,
  CATEGORIAS_COM_REVISAO,
  CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO,
  PRIORIDADES,
  visualDaCategoriaTarefa,
} from "@/lib/categoriaTarefaVisual";
import { STATUS_VALIDOS, statusFechaCronometro, statusLabel } from "@/lib/tarefas";
import { STATUS_CONTEUDO_VALIDOS, statusConteudoLabel } from "@/lib/revisaoConteudo";
import { criarNotificacao } from "@/lib/notificacoes";
import { dataIsoValida, dataIsoParaDate, dataHoraPublicacao } from "@/lib/midiaRevisao";

// Detalhe completo — alimenta o painel lateral (Etapa 1 v152): checklist,
// comentários internos, histórico de alterações e o cronômetro em aberto (se
// tiver), além dos dados básicos que já existiam espalhados pelas listas.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nome: true, cor: true, driveLogotiposFolderId: true } },
      responsavel: { select: { id: true, nome: true, fotoUrl: true } },
      bloqueioResponsavel: { select: { id: true, nome: true, fotoUrl: true } },
      checklist: { orderBy: { ordem: "asc" } },
      comentarios: { orderBy: { createdAt: "asc" }, include: { usuario: { select: { nome: true, fotoUrl: true } } } },
      historico: { orderBy: { createdAt: "desc" }, include: { usuario: { select: { nome: true } } } },
      // Revisão/aprovação de conteúdo (Etapa 2 v153) — versões mais recentes
      // primeiro, cada uma já com seus comentários (internos e compartilhados
      // misturados aqui; quem exibe decide o que mostrar pra cada perfil).
      versoes: {
        orderBy: { numero: "desc" },
        include: {
          criadoPor: { select: { nome: true, fotoUrl: true } },
          aprovadoPorContato: { select: { id: true, nome: true } },
          comentarios: {
            orderBy: { createdAt: "asc" },
            include: {
              usuario: { select: { nome: true, fotoUrl: true } },
              contato: { select: { nome: true } },
            },
          },
        },
      },
      // Dependências entre tarefas (Etapa 4 v158) — "dependeDe" é de quem ESTA
      // tarefa depende (precisa que termine antes); "bloqueiaDe" é quem depende
      // DELA (fica pra trás se essa atrasar). Ver comentário completo em
      // schema.prisma no model DependenciaTarefa/Tarefa.
      dependeDe: {
        include: { dependeDe: { select: { id: true, titulo: true, prazo: true, status: true } } },
      },
      bloqueiaDe: {
        include: { tarefa: { select: { id: true, titulo: true, prazo: true, status: true } } },
      },
      // "gerada automaticamente" (Etapa 4 v158) — só pra mostrar de onde essa
      // tarefa veio; nunca muda o comportamento de editar/excluir.
      rotinaGerada: { select: { id: true, mes: true, ano: true } },
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
  for (const [campo, label] of [["prazo", "Prazo de produção"], ["publicacaoSugeridaEm", "Dia planejado de postagem"], ["publicadoEm", "Data de publicação"]]) {
    if (body[campo] !== undefined && body[campo] !== null && body[campo] !== "" && !dataIsoValida(body[campo])) {
      return NextResponse.json({ erro: `${label} inválido.` }, { status: 400 });
    }
  }
  let publicacaoSugeridaEm: Date | null | undefined;
  if (body.publicacaoSugeridaEm !== undefined) {
    publicacaoSugeridaEm = body.publicacaoSugeridaEm ? dataIsoParaDate(body.publicacaoSugeridaEm) : null;
    if (publicacaoSugeridaEm && !Number.isFinite(publicacaoSugeridaEm.getTime())) return NextResponse.json({ erro: "Dia e horário de publicação inválidos." }, { status: 400 });
  }

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
  if (
    body.statusConteudo !== undefined &&
    body.statusConteudo !== null &&
    !STATUS_CONTEUDO_VALIDOS.includes(body.statusConteudo)
  ) {
    return NextResponse.json({ erro: "Status de conteúdo inválido." }, { status: 400 });
  }

  // Fluxo de revisão de conteúdo (Etapa 2 v153) — só faz sentido pra categoria
  // reel/arte (ver CATEGORIAS_COM_REVISAO).
  const categoriaFinal = body.categoria !== undefined ? body.categoria : existente.categoria;
  if (body.statusConteudo && !CATEGORIAS_COM_REVISAO.includes((categoriaFinal || "") as any)) {
    return NextResponse.json({ erro: "Essa categoria de tarefa não usa o fluxo de revisão de conteúdo." }, { status: 400 });
  }

  // Regras do fluxo (Etapa 2 v153): não dá pra pedir revisão/aprovação sem ter
  // material nenhum enviado, e não dá pra agendar/publicar sem a versão MAIS
  // RECENTE estar aprovada — é isso que garante "exigir nova aprovação quando o
  // conteúdo aprovado for alterado" na prática (uma versão nova sempre nasce sem
  // aprovação, e criar uma versão nova joga o status de volta pra revisão interna
  // sozinho — ver POST /api/tarefas/[id]/versoes).
  if (body.statusConteudo && body.statusConteudo !== "producao") {
    const versoesCount = await prisma.versaoConteudo.count({ where: { tarefaId: existente.id } });
    if (versoesCount === 0) {
      return NextResponse.json({ erro: "Envie uma versão do material antes de avançar nessa revisão." }, { status: 409 });
    }
    if (body.statusConteudo === "agendado" || body.statusConteudo === "publicado") {
      const ultimaVersao = await prisma.versaoConteudo.findFirst({
        where: { tarefaId: existente.id },
        orderBy: { numero: "desc" },
      });
      if (!ultimaVersao?.aprovadoEm) {
        return NextResponse.json(
          { erro: "A versão mais recente desse conteúdo ainda não foi aprovada pelo cliente." },
          { status: 409 }
        );
      }
    }
  }
  if (
    body.statusConteudo === "publicado" &&
    existente.statusConteudo !== "publicado" &&
    !(body.linkPublicacao || existente.linkPublicacao)
  ) {
    return NextResponse.json({ erro: "Informe o link da publicação antes de marcar como publicado." }, { status: 400 });
  }

  // Publicar o conteúdo conclui a tarefa geral sozinho (Etapa 2 v153) — evita
  // marcar "feito" duas vezes (uma no quadro, outra na revisão). Só entra em ação
  // quando o pedido não trouxe um status geral explícito diferente.
  let statusPedido: string | undefined = body.status;
  if (body.statusConteudo === "publicado" && statusPedido === undefined && existente.status !== "feito") {
    statusPedido = "feito";
  }
  const statusFinal = statusPedido !== undefined ? statusPedido : existente.status;
  const statusMudou = statusPedido !== undefined && statusPedido !== existente.status;

  // Exceção justificada de vídeo bruto (Etapa 2 v153) — mesma regra de
  // motivoBloqueio: motivo obrigatório pra ligar, os campos somem sozinhos ao
  // desligar. Calculada antes da trava abaixo pra poder liberar a passagem no
  // mesmo pedido que registra a exceção.
  let dadosExcecaoVideoBruto: {
    videoBrutoExcecao?: boolean;
    videoBrutoExcecaoMotivo?: string | null;
    videoBrutoExcecaoPorId?: string | null;
    videoBrutoExcecaoEm?: Date | null;
  } = {};
  if (body.videoBrutoExcecao !== undefined) {
    if (body.videoBrutoExcecao) {
      const motivoExcecao = body.videoBrutoExcecaoMotivo as string | null | undefined;
      if (!motivoExcecao || !motivoExcecao.trim()) {
        return NextResponse.json({ erro: "Informe o motivo da exceção de vídeo bruto." }, { status: 400 });
      }
      dadosExcecaoVideoBruto = {
        videoBrutoExcecao: true,
        videoBrutoExcecaoMotivo: motivoExcecao.trim(),
        videoBrutoExcecaoPorId: usuario.id,
        videoBrutoExcecaoEm: existente.videoBrutoExcecao ? existente.videoBrutoExcecaoEm : new Date(),
      };
    } else {
      dadosExcecaoVideoBruto = {
        videoBrutoExcecao: false,
        videoBrutoExcecaoMotivo: null,
        videoBrutoExcecaoPorId: null,
        videoBrutoExcecaoEm: null,
      };
    }
  }
  const excecaoVideoBrutoAtiva =
    dadosExcecaoVideoBruto.videoBrutoExcecao !== undefined
      ? dadosExcecaoVideoBruto.videoBrutoExcecao
      : existente.videoBrutoExcecao;

  // Trava: uma tarefa de "Criar Reel" com pasta vinculada só sai de "A fazer" (pra
  // em_andamento/feito) quando já existe um arquivo de vídeo lá dentro — a não ser
  // que tenha uma exceção justificada registrada (Etapa 2 v153). Bloquear (ver
  // abaixo) fica de fora dessa trava de propósito — a falta do bruto costuma ser
  // exatamente o MOTIVO do bloqueio, travar isso também não deixaria registrar o
  // problema.
  if (
    statusPedido !== undefined &&
    statusPedido !== "a_fazer" &&
    statusPedido !== "bloqueada" &&
    existente.driveFolderId &&
    CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO.includes((existente.categoria || "") as any) &&
    !excecaoVideoBrutoAtiva
  ) {
    let bruto;
    try { bruto = await verificarVideoBrutoNoDrive(existente.driveFolderId); }
    catch { return NextResponse.json({ erro: "Não consegui verificar o Drive. Confira a conexão e tente novamente." }, { status: 502 }); }
    if (bruto.temBruto !== true) {
      return NextResponse.json(
        {
          erro:
            bruto.mensagem,
        },
        { status: 409 }
      );
    }
  }

  // concluidaEm segue o status sozinho — marca a hora exata em que virou "feito"
  // (pra dar pra contar "feitas essa semana" no Início) e limpa se voltar atrás
  // (reabriu por engano, cliente pediu ajuste etc.), nunca fica com data velha.
  let concluidaEm: Date | null | undefined = undefined;
  if (statusMudou) {
    if (statusFinal === "feito") concluidaEm = new Date();
    else if (existente.status === "feito") concluidaEm = null;
  }

  // publicadoEm segue statusConteudo sozinho (mesmo espírito de concluidaEm), mas
  // aceita uma data explícita no corpo — "registrar link e data da publicação,
  // mesmo quando ela for realizada manualmente" (Etapa 2), pra quando a publicação
  // de verdade aconteceu antes de alguém atualizar o Instaby.
  let publicadoEmNovo: Date | null | undefined = undefined;
  if (body.publicadoEm !== undefined) {
    publicadoEmNovo = body.publicadoEm ? dataIsoParaDate(body.publicadoEm) : null;
  } else if (body.statusConteudo === "publicado" && existente.statusConteudo !== "publicado") {
    publicadoEmNovo = new Date();
  } else if (
    body.statusConteudo !== undefined &&
    body.statusConteudo !== "publicado" &&
    existente.statusConteudo === "publicado"
  ) {
    publicadoEmNovo = null;
  }

  // Estado "Bloqueada" (Etapa 1 v152) — motivo obrigatório, responsável pelo
  // desbloqueio opcional. Sai de bloqueada -> os 3 campos somem sozinhos.
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
    const prazoNovoDate = body.prazo ? dataIsoParaDate(body.prazo) : null;
    const mudou = (prazoNovoDate?.getTime() ?? null) !== (existente.prazo?.getTime() ?? null);
    if (mudou) {
      historico.push({
        campo: "prazo",
        valorAntigo: dataHoraPublicacao(existente.prazo?.toISOString() || null) || "Sem prazo",
        valorNovo: dataHoraPublicacao(prazoNovoDate?.toISOString() || null) || "Sem prazo",
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
  // Etapa 4 (v158) — "adicionar estimativa de tempo às tarefas", mesmo padrão de
  // campo simples opcional que os outros acima (ex.: link).
  if (
    body.estimativaHoras !== undefined &&
    (body.estimativaHoras ?? null) !== (existente.estimativaHoras ?? null)
  ) {
    historico.push({
      campo: "estimativaHoras",
      valorAntigo: existente.estimativaHoras != null ? `${existente.estimativaHoras}h` : "Sem estimativa",
      valorNovo: body.estimativaHoras != null ? `${body.estimativaHoras}h` : "Sem estimativa",
    });
  }
  if (statusMudou) {
    historico.push({ campo: "status", valorAntigo: statusLabel(existente.status), valorNovo: statusLabel(statusFinal) });
  }
  if (body.statusConteudo !== undefined && (body.statusConteudo || null) !== (existente.statusConteudo || null)) {
    historico.push({
      campo: "statusConteudo",
      valorAntigo: statusConteudoLabel(existente.statusConteudo),
      valorNovo: statusConteudoLabel(body.statusConteudo),
    });
  }
  if (body.linkPublicacao !== undefined && (body.linkPublicacao || null) !== (existente.linkPublicacao || null)) {
    historico.push({
      campo: "linkPublicacao",
      valorAntigo: existente.linkPublicacao || "Nenhum",
      valorNovo: body.linkPublicacao || "Nenhum",
    });
  }
  if (publicacaoSugeridaEm !== undefined && publicacaoSugeridaEm?.getTime() !== existente.publicacaoSugeridaEm?.getTime()) {
    historico.push({ campo: "publicacaoSugeridaEm", valorAntigo: dataHoraPublicacao(existente.publicacaoSugeridaEm?.toISOString() || null) || "Não definida", valorNovo: dataHoraPublicacao(publicacaoSugeridaEm?.toISOString() || null) || "Não definida" });
  }
  if (body.videoBrutoExcecao !== undefined && !!body.videoBrutoExcecao !== !!existente.videoBrutoExcecao) {
    historico.push({
      campo: "videoBrutoExcecao",
      valorAntigo: existente.videoBrutoExcecao ? "Com exceção" : "Sem exceção",
      valorNovo: body.videoBrutoExcecao ? "Com exceção" : "Sem exceção",
    });
  }

  const tarefa = await prisma.tarefa.update({
    where: { id: params.id },
    data: {
      ...(statusPedido !== undefined && { status: statusPedido }),
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.descricao !== undefined && { descricao: body.descricao }),
      ...(body.prioridade !== undefined && { prioridade: body.prioridade }),
      ...(body.categoria !== undefined && { categoria: body.categoria }),
      ...(body.prazo !== undefined && { prazo: body.prazo ? dataIsoParaDate(body.prazo) : null }),
      ...(body.link !== undefined && { link: body.link || null }),
      ...(body.estimativaHoras !== undefined && {
        estimativaHoras: body.estimativaHoras != null ? Number(body.estimativaHoras) : null,
      }),
      // "sem responsável" é um valor válido — manda null explícito pra tirar o
      // responsável de uma tarefa (não confundir com "undefined" de não mexer).
      ...(body.responsavelId !== undefined && { responsavelId: body.responsavelId || null }),
      ...(concluidaEm !== undefined && { concluidaEm }),
      ...dadosBloqueio,
      ...(body.statusConteudo !== undefined && { statusConteudo: body.statusConteudo || null }),
      ...(body.linkPublicacao !== undefined && { linkPublicacao: body.linkPublicacao || null }),
      ...(publicacaoSugeridaEm !== undefined && { publicacaoSugeridaEm }),
      ...(publicadoEmNovo !== undefined && { publicadoEm: publicadoEmNovo }),
      ...dadosExcecaoVideoBruto,
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
      const driveFolderId = await garantirPastaTarefa(tarefa.id);
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
