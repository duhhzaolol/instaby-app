import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { calcularImpactoPrazo, TarefaParaDependencia } from "@/lib/dependenciasTarefa";

// "Mostrar impactos antes de alterar prazos" (Etapa 4 v158) — rota SÓ DE LEITURA,
// nunca muda nada: o painel lateral chama isso antes de confirmar uma troca de
// prazo, mostra a lista de tarefas que ficariam apertadas, e a pessoa decide se
// confirma o PATCH de verdade (que pode mudar o prazo mesmo assim — ver
// lib/dependenciasTarefa.ts: isso nunca bloqueia, só informa).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const novoPrazoStr = request.nextUrl.searchParams.get("novoPrazo");
  if (!novoPrazoStr) {
    return NextResponse.json({ erro: "Informe novoPrazo." }, { status: 400 });
  }
  const novoPrazo = new Date(novoPrazoStr);
  if (isNaN(novoPrazo.getTime())) {
    return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  }

  // Anda pelo grafo inteiro de dependências (não só o desta tarefa) porque o
  // impacto pode ser transitivo (dependente do dependente) — volume baixo o
  // bastante nesse sistema (agência, não uma fábrica de milhares de tarefas) pra
  // não precisar de uma consulta recursiva no banco.
  const todasDependencias = await prisma.dependenciaTarefa.findMany({
    select: { tarefaId: true, dependeDeId: true },
  });
  const idsEnvolvidos = new Set<string>([tarefa.id]);
  for (const d of todasDependencias) {
    idsEnvolvidos.add(d.tarefaId);
    idsEnvolvidos.add(d.dependeDeId);
  }
  // Array.from (não [...set]) — o projeto compila com target es5, que não permite
  // espalhar um Set direto (só array/tupla) sem a flag downlevelIteration.
  const tarefasEnvolvidas: TarefaParaDependencia[] = await prisma.tarefa.findMany({
    where: { id: { in: Array.from(idsEnvolvidos) } },
    select: { id: true, titulo: true, prazo: true, status: true },
  });
  // Loop simples (não .map()+new Map()) — com o cliente Prisma tipado como "any"
  // nesse ambiente (ver comentário em lib/prisma.ts sobre o sandbox sem "prisma
  // generate"), encadear .map() com new Map() aqui confundia a inferência de tipo;
  // um for/of com o array já anotado acima resolve sem ambiguidade.
  const tarefasPorId = new Map<string, TarefaParaDependencia>();
  for (const t of tarefasEnvolvidas) {
    tarefasPorId.set(t.id, t);
  }

  const impactadas = calcularImpactoPrazo(tarefa.id, novoPrazo, todasDependencias, tarefasPorId);

  return NextResponse.json({ impactadas });
}
