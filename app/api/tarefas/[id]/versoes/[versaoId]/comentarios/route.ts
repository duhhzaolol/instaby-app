import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente, usuariosParaNotificarRevisao } from "@/lib/permissoes";
import { notificarVarios } from "@/lib/notificacoes";
import { CATEGORIAS_COM_REVISAO } from "@/lib/categoriaTarefaVisual";
import { nomeClientePeloLink } from "@/lib/midiaRevisao";

const LIMITE_TEXTO = 2000;

// Comentário numa versão de conteúdo (Etapa 2 v153) — dois jeitos de chegar aqui:
// 1) equipe, autenticada, no painel interno (pode marcar interno=true, comentário
//    "só nosso", nunca aparece pro cliente); 2) o próprio cliente, sem login, pela
//    página pública de revisão (/revisao/[tarefaId]) — sempre nasce interno=false
//    (cliente não tem "comentar pra si mesmo"). A origem é registrada como
//    "Cliente (pelo link de revisão)", sem afirmar a identidade de uma pessoa.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versaoId: string } }
) {
  const versao = await prisma.versaoConteudo.findUnique({
    where: { id: params.versaoId },
    include: { tarefa: { select: { id: true, clienteId: true, titulo: true, categoria: true, responsavelId: true } } },
  });
  if (!versao || versao.tarefaId !== params.id || !versao.tarefa.clienteId || !CATEGORIAS_COM_REVISAO.includes(versao.tarefa.categoria as any)) {
    return NextResponse.json({ erro: "Versão não encontrada" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const ultima = await prisma.versaoConteudo.findFirst({ where: { tarefaId: params.id }, orderBy: { numero: "desc" } });
  if (ultima?.id !== versao.id) return NextResponse.json({ erro: "Uma nova versão foi enviada. Atualize a página." }, { status: 409 });
  if (versao.aprovadoEm) return NextResponse.json({ erro: "Essa versão já está aprovada." }, { status: 409 });
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
    if (Number.isFinite(seg) && seg >= 0 && seg <= 86400) momentoVideoSegundos = Math.floor(seg);
    else return NextResponse.json({ erro: "Momento do vídeo inválido." }, { status: 400 });
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
  if (usuario && !(await podeVerCliente(usuario, versao.tarefa.clienteId))) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  const peloLink = !usuario || body.origem === "pagina_revisao";

  let dadosAutor: { usuarioId?: string; autorNomeLivre?: string; interno: boolean };
  if (usuario && !peloLink) {
    dadosAutor = { usuarioId: usuario.id, interno: body.interno === true };
  } else {
    dadosAutor = { autorNomeLivre: nomeClientePeloLink(), interno: false };
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
  try { if (versao.tarefa.clienteId) {
    const pessoas = (await usuariosParaNotificarRevisao(versao.tarefa.clienteId, versao.tarefa.responsavelId)).filter(
      (p) => peloLink || p.id !== usuario?.id
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
  } } catch { console.error("Não foi possível notificar o comentário de revisão."); }

  return NextResponse.json(peloLink ? { id: comentario.id, texto: comentario.texto, createdAt: comentario.createdAt, autorNome: comentario.autorNomeLivre, momentoVideoSegundos, pontoImagemX, pontoImagemY } : comentario, { status: 201 });
}
