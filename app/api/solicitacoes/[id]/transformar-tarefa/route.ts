import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaTarefa } from "@/lib/google";
import { CATEGORIAS_COM_PASTA_DRIVE, visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { formatarSolicitacaoComoDescricao } from "@/lib/solicitacoes";

// "Permitir transformar solicitação em tarefa preservando briefing e anexos"
// (Etapa 3 v157) — cria a tarefa reaproveitando os MESMOS campos/regras de
// POST /api/tarefas (categoria, pasta do Drive sob demanda etc.), sem duplicar
// esse fluxo: só monta os dados a partir da solicitação em vez de vir do corpo
// de um formulário de tarefa comum.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const solicitacao = await prisma.solicitacao.findUnique({ where: { id: params.id } });
  if (!solicitacao) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, solicitacao.clienteId)) || !permissoesDe(usuario).acessoClienteCompleto) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (solicitacao.tarefaGeradaId) {
    return NextResponse.json({ erro: "Essa solicitação já virou uma tarefa." }, { status: 409 });
  }

  const tituloBase = solicitacao.descricao.trim().slice(0, 60);
  const titulo =
    tituloBase || `Pedido do cliente — ${visualDaCategoriaTarefa(solicitacao.categoria).label}`;

  const tarefa = await prisma.tarefa.create({
    data: {
      clienteId: solicitacao.clienteId,
      titulo,
      tipo: "tarefa",
      categoria: solicitacao.categoria,
      descricao: formatarSolicitacaoComoDescricao({
        descricao: solicitacao.descricao,
        categoria: solicitacao.categoria,
        respostas: (solicitacao.respostas as Record<string, string> | null) || null,
      }),
      prioridade: solicitacao.prioridade,
      prazo: solicitacao.prazoConfirmado || solicitacao.prazoDesejado || null,
      anexos: solicitacao.anexos,
    },
  });

  // Sob demanda, mesmo best-effort de POST /api/tarefas — se o Drive falhar, a
  // tarefa já foi criada normalmente, só fica sem pasta vinculada.
  if (tarefa.clienteId && tarefa.prazo && CATEGORIAS_COM_PASTA_DRIVE.includes((tarefa.categoria || "") as any)) {
    try {
      await garantirPastaTarefa(tarefa.id);
    } catch (e) {
      console.error("Erro ao preparar pasta do Drive pra essa tarefa:", e);
    }
  }

  await prisma.solicitacao.update({
    where: { id: solicitacao.id },
    data: {
      tarefaGeradaId: tarefa.id,
      ...(solicitacao.status === "pendente" && { status: "em_andamento" }),
    },
  });

  return NextResponse.json({ tarefaId: tarefa.id }, { status: 201 });
}
