import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente, usuariosParaNotificarRevisao } from "@/lib/permissoes";
import { notificarVarios } from "@/lib/notificacoes";

const LIMITE_NOME = 120;

// Aprovação de uma versão específica (Etapa 2 v153) — "registrar aprovador, data e
// versão aprovada". Só isso é editável aqui (vídeo/imagem/legenda nunca mudam
// depois de criados, ver POST de /api/tarefas/[id]/versoes) e só uma vez: uma
// versão já aprovada não aceita nova aprovação — a correção é sempre criar versão
// nova, que já nasce sem aprovação (é isso que impede reaprovar por cima e garante
// "exigir nova aprovação quando o conteúdo aprovado for alterado").
//
// Dois jeitos de chegar aqui, igual o comentário (ver ./comentarios/route.ts):
// 1) equipe autenticada, registrando uma aprovação recebida por fora (WhatsApp,
//    ligação) — pode escolher um Contato cadastrado do cliente ou digitar um nome;
// 2) o próprio cliente, sem login, clicando "Aprovar" na página pública de
//    revisão — sempre por nome digitado na hora, já que não existe conta de
//    cliente nesse sistema.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; versaoId: string } }
) {
  const versao = await prisma.versaoConteudo.findUnique({
    where: { id: params.versaoId },
    include: { tarefa: { select: { id: true, clienteId: true, titulo: true, responsavelId: true } } },
  });
  if (!versao || versao.tarefaId !== params.id) {
    return NextResponse.json({ erro: "Versão não encontrada" }, { status: 404 });
  }
  if (versao.aprovadoEm) {
    return NextResponse.json({ erro: "Essa versão já foi aprovada." }, { status: 409 });
  }

  const body = await request.json();
  const usuario = await getUsuarioAtual();

  let dadosAprovacao: { aprovadoPorContatoId?: string; aprovadoPorNomeLivre?: string };
  if (usuario) {
    if (versao.tarefa.clienteId && !(await podeVerCliente(usuario, versao.tarefa.clienteId))) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
    }
    if (body.aprovadoPorContatoId) {
      const contato = await prisma.contato.findUnique({ where: { id: body.aprovadoPorContatoId } });
      if (!contato || contato.clienteId !== versao.tarefa.clienteId) {
        return NextResponse.json({ erro: "Contato inválido para esse cliente." }, { status: 400 });
      }
      dadosAprovacao = { aprovadoPorContatoId: contato.id };
    } else {
      const nome = body.aprovadoPorNomeLivre ? String(body.aprovadoPorNomeLivre).trim().slice(0, LIMITE_NOME) : "";
      if (!nome) {
        return NextResponse.json({ erro: "Informe quem aprovou (um contato cadastrado ou um nome)." }, { status: 400 });
      }
      dadosAprovacao = { aprovadoPorNomeLivre: nome };
    }
  } else {
    const nome = body.aprovadoPorNomeLivre ? String(body.aprovadoPorNomeLivre).trim().slice(0, LIMITE_NOME) : "";
    if (!nome) return NextResponse.json({ erro: "Informe seu nome para aprovar." }, { status: 400 });
    dadosAprovacao = { aprovadoPorNomeLivre: nome };
  }

  const atualizada = await prisma.versaoConteudo.update({
    where: { id: versao.id },
    data: { ...dadosAprovacao, aprovadoEm: new Date() },
    include: { aprovadoPorContato: { select: { id: true, nome: true } }, criadoPor: { select: { nome: true, fotoUrl: true } } },
  });

  // Avisa quem acompanha esse cliente de perto + o responsável pela tarefa — nunca
  // quem acabou de registrar a aprovação (se foi a própria equipe).
  if (versao.tarefa.clienteId) {
    const pessoas = (await usuariosParaNotificarRevisao(versao.tarefa.clienteId, versao.tarefa.responsavelId)).filter(
      (p) => p.id !== usuario?.id
    );
    await notificarVarios(
      pessoas.map((p) => p.id),
      {
        tipo: "revisao_aprovada",
        titulo: `Versão aprovada: ${versao.tarefa.titulo}`,
        corpo: `Versão ${versao.numero} aprovada${
          atualizada.aprovadoPorNomeLivre || atualizada.aprovadoPorContato ? ` por ${atualizada.aprovadoPorNomeLivre || atualizada.aprovadoPorContato?.nome}` : ""
        }.`,
        tarefaId: versao.tarefa.id,
        clienteId: versao.tarefa.clienteId,
        link: `/dashboard?tarefa=${versao.tarefa.id}`,
        agrupadorChave: `revisao_aprovada:${versao.tarefa.id}`,
      }
    );
  }

  return NextResponse.json(atualizada);
}
