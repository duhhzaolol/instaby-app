import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUsuarioAtual,
  podeVerCliente,
  usuariosParaNotificarRevisao,
} from "@/lib/permissoes";
import { notificarVarios } from "@/lib/notificacoes";
import { CATEGORIAS_COM_REVISAO } from "@/lib/categoriaTarefaVisual";
import { nomeClientePeloLink } from "@/lib/midiaRevisao";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; versaoId: string } },
) {
  const body = await request.json().catch(() => null);
  if (!body)
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const versao = await prisma.versaoConteudo.findUnique({
    where: { id: params.versaoId },
    include: {
      tarefa: {
        select: {
          id: true,
          clienteId: true,
          titulo: true,
          categoria: true,
          responsavelId: true,
        },
      },
    },
  });
  if (
    !versao ||
    versao.tarefaId !== params.id ||
    !versao.tarefa.clienteId ||
    !CATEGORIAS_COM_REVISAO.includes(versao.tarefa.categoria as any)
  )
    return NextResponse.json(
      { erro: "Versão não encontrada." },
      { status: 404 },
    );
  const usuario = await getUsuarioAtual();
  if (usuario && !(await podeVerCliente(usuario, versao.tarefa.clienteId)))
    return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
  const peloLink = !usuario || body.origem === "pagina_revisao";
  const acao = body.acao || "aprovar"; // preserva a aprovação registrada pela equipe
  if (!["aprovar", "pedir_alteracoes"].includes(acao))
    return NextResponse.json({ erro: "Decisão inválida." }, { status: 400 });
  const ultima = await prisma.versaoConteudo.findFirst({
    where: { tarefaId: params.id },
    orderBy: { numero: "desc" },
  });
  if (ultima?.id !== versao.id)
    return NextResponse.json(
      {
        erro: "Uma nova versão foi enviada. Atualize a página para revisar o material atual.",
      },
      { status: 409 },
    );
  if (versao.aprovadoEm || versao.alteracoesSolicitadasEm)
    return NextResponse.json(
      { erro: "Essa versão já recebeu uma decisão. Atualize a página." },
      { status: 409 },
    );

  let dadosAprovacao: {
    aprovadoPorContatoId?: string;
    aprovadoPorNomeLivre?: string;
  } = {};
  if (acao === "aprovar") {
    if (peloLink)
      dadosAprovacao = { aprovadoPorNomeLivre: nomeClientePeloLink() };
    else if (body.aprovadoPorContatoId) {
      const contato = await prisma.contato.findUnique({
        where: { id: body.aprovadoPorContatoId },
      });
      if (!contato || contato.clienteId !== versao.tarefa.clienteId)
        return NextResponse.json(
          { erro: "Contato inválido para esse cliente." },
          { status: 400 },
        );
      dadosAprovacao = { aprovadoPorContatoId: contato.id };
    } else {
      const nome = String(body.aprovadoPorNomeLivre || "")
        .trim()
        .slice(0, 120);
      if (!nome)
        return NextResponse.json(
          { erro: "Informe quem aprovou." },
          { status: 400 },
        );
      dadosAprovacao = { aprovadoPorNomeLivre: nome };
    }
  } else {
    const comentarios = await prisma.comentarioRevisao.count({
      where: { versaoId: versao.id, interno: false },
    });
    if (!comentarios)
      return NextResponse.json(
        {
          erro: "Deixe ao menos um comentário explicando o que deseja alterar.",
        },
        { status: 400 },
      );
  }

  const agora = new Date();
  const registrada = await prisma.$transaction(async (tx) => {
    const alterada = await tx.versaoConteudo.updateMany({
      where: {
        id: versao.id,
        aprovadoEm: null,
        alteracoesSolicitadasEm: null,
        tarefa: { versoes: { none: { numero: { gt: versao.numero } } } },
      },
      data:
        acao === "aprovar"
          ? { ...dadosAprovacao, aprovadoEm: agora }
          : { alteracoesSolicitadasEm: agora },
    });
    if (!alterada.count) return false;
    if (acao === "pedir_alteracoes") {
      await tx.tarefa.update({
        where: { id: params.id },
        data: { statusConteudo: "producao" },
      });
      await tx.historicoTarefa.create({
        data: {
          tarefaId: params.id,
          campo: "revisao_cliente",
          valorNovo: `Alterações solicitadas na versão ${versao.numero}`,
        },
      });
    }
    return true;
  });
  if (!registrada)
    return NextResponse.json(
      {
        erro: "Essa versão foi substituída ou já recebeu uma decisão. Atualize a página.",
      },
      { status: 409 },
    );

  // A decisão já está salva. Uma falha na notificação não deve pedir ao cliente
  // para repetir a aprovação e produzir um resultado contraditório.
  try {
    const pessoas = (
      await usuariosParaNotificarRevisao(
        versao.tarefa.clienteId,
        versao.tarefa.responsavelId,
      )
    ).filter((p) => peloLink || p.id !== usuario?.id);
    await notificarVarios(
      pessoas.map((p) => p.id),
      {
        tipo: acao === "aprovar" ? "revisao_aprovada" : "comentario_revisao",
        titulo: `${acao === "aprovar" ? "Versão aprovada" : "Alterações solicitadas"}: ${versao.tarefa.titulo}`,
        corpo: `Versão ${versao.numero}${acao === "aprovar" ? " aprovada." : ": confira os comentários do cliente."}`,
        tarefaId: params.id,
        clienteId: versao.tarefa.clienteId,
        link: `/dashboard?tarefa=${params.id}`,
        agrupadorChave: `revisao_decisao:${params.id}`,
      },
    );
  } catch {
    console.error("Não foi possível notificar a decisão de revisão.");
  }
  return NextResponse.json({
    id: versao.id,
    aprovadoEm: acao === "aprovar" ? agora.toISOString() : null,
    alteracoesSolicitadasEm:
      acao === "pedir_alteracoes" ? agora.toISOString() : null,
    aprovadoPorNomeLivre: dadosAprovacao.aprovadoPorNomeLivre || null,
  });
}
