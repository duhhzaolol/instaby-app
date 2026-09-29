import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente, usuariosParaNotificarRevisao } from "@/lib/permissoes";
import { notificarVarios } from "@/lib/notificacoes";

const LIMITE_TEXTO = 2000;
const LIMITE_NOME = 120;

// Comentário numa versão de conteúdo (Etapa 2 v153) — dois jeitos de chegar aqui:
// 1) equipe, autenticada, no painel interno (pode marcar interno=true, comentário
//    "só nosso", nunca aparece pro cliente); 2) o próprio cliente, sem login, pela
//    página pública de revisão (/revisao/[tarefaId]) — sempre nasce interno=false
//    (cliente não tem "comentar pra si mesmo") e pede um nome digitado na hora,
//    porque não existe conta de cliente nesse sistema.
export async function POST(
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

  const body = await request.json();
  const texto = body.texto ? String(body.texto).trim().slice(0, LIMITE_TEXTO) : "";
  if (!texto) return NextResponse.json({ erro: "Escreve alguma coisa antes de comentar." }, { status: 400 });

  // Ponto do comentário — nunca os dois tipos ao mesmo tempo (vídeo tem prioridade
  // se por engano vierem os dois preenchidos); sem nenhum dos dois = comentário
  // geral da versão.
  let momentoVideoSegundos: number | null = null;
  let pontoImagemX: number | null = null;
  let pontoImagemY: number | null = null;
  if (body.momentoVideoSegundos !== undefined && body.momentoVideoSegundos !== null) {
    const seg = Number(body.momentoVideoSegundos);
    if (!isNaN(seg) && seg >= 0) momentoVideoSegundos = seg;
  } else if (
    body.pontoImagemX !== undefined &&
    body.pontoImagemX !== null &&
    body.pontoImagemY !== undefined &&
    body.pontoImagemY !== null
  ) {
    const x = Number(body.pontoImagemX);
    const y = Number(body.pontoImagemY);
    if (!isNaN(x) && !isNaN(y) && x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      pontoImagemX = x;
      pontoImagemY = y;
    }
  }

  const usuario = await getUsuarioAtual();

  let dadosAutor: { usuarioId?: string; autorNomeLivre?: string; interno: boolean };
  if (usuario) {
    if (versao.tarefa.clienteId && !(await podeVerCliente(usuario, versao.tarefa.clienteId))) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
    }
    dadosAutor = { usuarioId: usuario.id, interno: body.interno === true };
  } else {
    const nome = body.autorNome ? String(body.autorNome).trim().slice(0, LIMITE_NOME) : "";
    if (!nome) return NextResponse.json({ erro: "Informe seu nome antes de comentar." }, { status: 400 });
    dadosAutor = { autorNomeLivre: nome, interno: false };
  }

  const comentario = await prisma.comentarioRevisao.create({
    data: { versaoId: versao.id, texto, momentoVideoSegundos, pontoImagemX, pontoImagemY, ...dadosAutor },
    include: {
      usuario: { select: { nome: true, fotoUrl: true } },
      contato: { select: { nome: true } },
    },
  });

  // Avisa quem acompanha esse cliente de perto + o responsável pela tarefa — nunca
  // quem acabou de comentar (se foi a própria equipe).
  if (versao.tarefa.clienteId) {
    const pessoas = (await usuariosParaNotificarRevisao(versao.tarefa.clienteId, versao.tarefa.responsavelId)).filter(
      (p) => p.id !== usuario?.id
    );
    await notificarVarios(
      pessoas.map((p) => p.id),
      {
        tipo: "comentario_revisao",
        titulo: `Novo comentário na revisão de: ${versao.tarefa.titulo}`,
        corpo: texto,
        tarefaId: versao.tarefa.id,
        clienteId: versao.tarefa.clienteId,
        link: `/dashboard?tarefa=${versao.tarefa.id}`,
        agrupadorChave: `comentario_revisao:${versao.tarefa.id}`,
      }
    );
  }

  return NextResponse.json(comentario, { status: 201 });
}
