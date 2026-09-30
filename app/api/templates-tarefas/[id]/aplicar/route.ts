import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { garantirPastaTarefa } from "@/lib/google";
import { CATEGORIAS_COM_PASTA_DRIVE } from "@/lib/categoriaTarefaVisual";
import { montarCicloDeTarefas } from "@/lib/templatesTarefas";

// "Aplicar" nunca tinha checagem de permissão nenhuma (achado junto com a mesma
// lacuna nas outras rotas de templates-tarefas — ver comentário em
// ../../route.ts). Diferente de criar/editar/excluir o TEMPLATE em si
// (gerenciarConfiguracoes), aplicar só CRIA TAREFAS num cliente — mesma ação de
// sempre, então usa a mesma trava de POST /api/tarefas (podeVerCliente), não uma
// permissão de configuração.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  if (body.clienteId && !(await podeVerCliente(usuario, body.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const template = await prisma.templateTarefas.findUnique({
    where: { id: params.id },
    include: { etapas: { orderBy: { ordem: "asc" } } },
  });
  if (!template) {
    return NextResponse.json({ erro: "Template não encontrado" }, { status: 404 });
  }

  // Modo simples (comportamento ORIGINAL, preservado 100%): template sem etapas
  // configuradas continua criando 1 tarefa por item da lista, sem prazo, tudo de
  // uma vez — igual sempre foi.
  if (template.etapas.length === 0) {
    await prisma.tarefa.createMany({
      data: template.itens.map((titulo) => ({
        titulo,
        clienteId: body.clienteId || null,
      })),
    });
    return NextResponse.json({ ok: true, criadas: template.itens.length });
  }

  // Etapa 4 (v158) — modo "ciclo completo": exige a data-alvo (entrega/publicação)
  // pra calcular o prazo relativo de cada etapa.
  if (!body.dataAlvo) {
    return NextResponse.json({ erro: "Informe a data de entrega/publicação desse ciclo." }, { status: 400 });
  }
  const dataAlvo = new Date(body.dataAlvo);
  if (isNaN(dataAlvo.getTime())) {
    return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  }

  const cicloOrdenado = montarCicloDeTarefas(template.etapas, dataAlvo);

  // Cada etapa é criada em sequência (não createMany) porque precisamos do id de
  // cada uma pra encadear a dependência com a anterior e, quando aplicável, criar
  // a pasta do Drive — mesmo espírito sequencial de POST /api/tarefas pra 1 tarefa
  // só, só que em loop.
  const criadas: { id: string; categoria: string | null; prazo: Date }[] = [];
  for (const etapa of cicloOrdenado) {
    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: etapa.titulo,
        categoria: etapa.categoria,
        clienteId: body.clienteId || null,
        prazo: etapa.prazo,
        estimativaHoras: etapa.estimativaHoras,
      },
    });
    criadas.push({ id: tarefa.id, categoria: tarefa.categoria, prazo: etapa.prazo });

    const anterior = criadas[criadas.length - 2];
    if (anterior) {
      await prisma.dependenciaTarefa.create({
        data: { tarefaId: tarefa.id, dependeDeId: anterior.id },
      });
    }

    if (body.clienteId && CATEGORIAS_COM_PASTA_DRIVE.includes((tarefa.categoria || "") as any)) {
      try {
        await garantirPastaTarefa(tarefa.id);
      } catch (e) {
        console.error("Erro ao preparar pasta do Drive pra essa tarefa do ciclo:", e);
      }
    }
  }

  return NextResponse.json({ ok: true, criadas: criadas.length });
}
