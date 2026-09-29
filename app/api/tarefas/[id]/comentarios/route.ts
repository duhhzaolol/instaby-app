import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { criarNotificacao } from "@/lib/notificacoes";

// Comentário interno de uma tarefa (Etapa 1 v152) — a listagem em si já vem
// embutida em GET /api/tarefas/[id] (painel lateral busca tudo de uma vez); esta
// rota só cria. Nunca editado/apagado depois — mesmo espírito de MovimentacaoVerba.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.texto || !body.texto.trim()) {
    return NextResponse.json({ erro: "Escreve alguma coisa antes de comentar." }, { status: 400 });
  }

  const comentario = await prisma.comentarioTarefa.create({
    data: { tarefaId: tarefa.id, usuarioId: usuario.id, texto: body.texto.trim() },
    include: { usuario: { select: { nome: true, fotoUrl: true } } },
  });

  // Avisa quem é responsável pela tarefa (se não foi ele mesmo quem comentou) —
  // ação "responder" do sino leva direto pro painel com o comentário à vista.
  if (tarefa.responsavelId && tarefa.responsavelId !== usuario.id) {
    await criarNotificacao({
      usuarioId: tarefa.responsavelId,
      tipo: "comentario_tarefa",
      titulo: `Novo comentário em: ${tarefa.titulo}`,
      corpo: body.texto.trim(),
      tarefaId: tarefa.id,
      clienteId: tarefa.clienteId,
      link: `/dashboard?tarefa=${tarefa.id}`,
      criadaPorId: usuario.id,
    });
  }

  return NextResponse.json(comentario, { status: 201 });
}
