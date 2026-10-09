import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { CATEGORIAS_COM_REVISAO } from "@/lib/categoriaTarefaVisual";
import { statusConteudoLabel } from "@/lib/revisaoConteudo";
import { ehPlanejamento } from "@/lib/organizacaoTarefas";

// Cria uma versão NOVA de material pra revisão (Etapa 2 v153) — sempre uma linha
// adicional, nunca edita uma já existente (vídeo/imagem/legenda ficam congelados
// no momento do envio, pra nunca misturar comentário de uma versão com o material
// de outra). Só a equipe envia versão — o cliente só comenta/aprova, pela página
// pública de revisão (ver /revisao/[tarefaId] e as rotas de comentário/aprovação
// dentro de /versoes/[versaoId]).
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (ehPlanejamento(tarefa)) {
    return NextResponse.json({ erro: "Coloque este conteúdo em produção antes de enviar uma versão para revisão." }, { status: 409 });
  }
  if (!CATEGORIAS_COM_REVISAO.includes((tarefa.categoria || "") as any)) {
    return NextResponse.json({ erro: "Essa categoria de tarefa não usa o fluxo de revisão de conteúdo." }, { status: 400 });
  }

  const body = await request.json();
  const linkVideo = body.linkVideo ? String(body.linkVideo).trim() : null;
  const linkImagem = body.linkImagem ? String(body.linkImagem).trim() : null;
  const legenda = body.legenda ? String(body.legenda).trim() : null;
  if (!linkVideo && !linkImagem && !legenda) {
    return NextResponse.json({ erro: "Envie ao menos um link de vídeo/imagem ou a legenda." }, { status: 400 });
  }

  const ultima = await prisma.versaoConteudo.findFirst({
    where: { tarefaId: tarefa.id },
    orderBy: { numero: "desc" },
  });
  const numero = (ultima?.numero || 0) + 1;

  const versao = await prisma.versaoConteudo.create({
    data: { tarefaId: tarefa.id, numero, linkVideo, linkImagem, legenda, criadoPorId: usuario.id },
    include: {
      criadoPor: { select: { nome: true, fotoUrl: true } },
      aprovadoPorContato: { select: { id: true, nome: true } },
      comentarios: true,
    },
  });

  // Ajusta o status de conteúdo sozinho, sem exigir um 2º passo manual: entra no
  // fluxo pela 1ª vez (sem revisão -> produção), ou volta pra revisão interna se
  // uma correção chegou depois de já ter ido pra aprovação/agendamento/publicação
  // — é isso que garante "exigir nova aprovação quando o conteúdo aprovado for
  // alterado" mesmo se ninguém mexer no status manualmente (a versão nova em si já
  // nasce sem aprovação; isso aqui só evita a tarefa continuar marcada como
  // "Agendado"/"Publicado" com uma versão desatualizada por baixo).
  let statusConteudoNovo: string | null = null;
  if (!tarefa.statusConteudo) {
    statusConteudoNovo = "producao";
  } else if (["aprovacao_cliente", "agendado", "publicado"].includes(tarefa.statusConteudo)) {
    statusConteudoNovo = "revisao_interna";
  }
  if (statusConteudoNovo) {
    await prisma.tarefa.update({ where: { id: tarefa.id }, data: { statusConteudo: statusConteudoNovo } });
    await prisma.historicoTarefa.create({
      data: {
        tarefaId: tarefa.id,
        usuarioId: usuario.id,
        campo: "statusConteudo",
        valorAntigo: statusConteudoLabel(tarefa.statusConteudo),
        valorNovo: statusConteudoLabel(statusConteudoNovo),
      },
    });
  }

  return NextResponse.json(versao, { status: 201 });
}
