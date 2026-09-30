import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";
import { criariCiclo } from "@/lib/dependenciasTarefa";

// Candidatas pra virar dependência dessa tarefa (Etapa 4 v158) — outras tarefas do
// MESMO cliente (ou, se essa tarefa for interna, outras tarefas também sem
// cliente), ainda não concluídas, e que ainda não têm nenhum vínculo (nas duas
// direções) com esta. Alimenta o <select> do painel lateral; não devolve os
// vínculos JÁ existentes porque isso já vem no GET de /api/tarefas/[id]
// (tarefa.dependeDe / tarefa.bloqueiaDe).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const jaLigadas = await prisma.dependenciaTarefa.findMany({
    where: { OR: [{ tarefaId: tarefa.id }, { dependeDeId: tarefa.id }] },
    select: { tarefaId: true, dependeDeId: true },
  });
  const idsExcluidos = new Set<string>([tarefa.id]);
  for (const d of jaLigadas) {
    idsExcluidos.add(d.tarefaId);
    idsExcluidos.add(d.dependeDeId);
  }

  const candidatas = await prisma.tarefa.findMany({
    where: {
      id: { notIn: Array.from(idsExcluidos) },
      clienteId: tarefa.clienteId,
      status: { not: "feito" },
    },
    select: { id: true, titulo: true, prazo: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ candidatas });
}

// "Criar dependências entre tarefas" (Etapa 4 v158) — mesma trava de permissão de
// checklist/comentário (POST /api/tarefas/[id]/checklist): é uma ação do dia a dia
// sobre uma tarefa que a pessoa já pode ver, não uma configuração. Remover um
// vínculo é rota à parte, por id do vínculo — ver app/api/dependencias/[id]/route.ts
// (mesmo espírito de checklist: criar é aninhado, editar/excluir é por id próprio).
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const tarefa = await prisma.tarefa.findUnique({ where: { id: params.id } });
  if (!tarefa) return NextResponse.json({ erro: "Tarefa não encontrada" }, { status: 404 });
  if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const dependeDeId = body.dependeDeId as string | undefined;
  if (!dependeDeId) {
    return NextResponse.json({ erro: "Informe de qual tarefa esta depende." }, { status: 400 });
  }
  if (dependeDeId === tarefa.id) {
    return NextResponse.json({ erro: "Uma tarefa não pode depender dela mesma." }, { status: 400 });
  }

  const precedente = await prisma.tarefa.findUnique({ where: { id: dependeDeId } });
  if (!precedente) {
    return NextResponse.json({ erro: "Não encontramos a tarefa da qual esta deveria depender." }, { status: 404 });
  }
  // Mesma trava de cliente na outra ponta — não dá pra ligar a uma tarefa de
  // cliente que a pessoa não tem acesso, mesmo sabendo o id de antemão.
  if (precedente.clienteId && !(await podeVerCliente(usuario, precedente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const jaExiste = await prisma.dependenciaTarefa.findUnique({
    where: { tarefaId_dependeDeId: { tarefaId: tarefa.id, dependeDeId } },
  });
  if (jaExiste) {
    return NextResponse.json({ erro: "Essa dependência já existe." }, { status: 409 });
  }

  // Ciclo (A depende de B que já depende de A, direta ou transitivamente) não tem
  // leitura possível de "impacto de prazo" — ver lib/dependenciasTarefa.ts.
  const todasDependencias = await prisma.dependenciaTarefa.findMany({
    select: { tarefaId: true, dependeDeId: true },
  });
  if (criariCiclo(tarefa.id, dependeDeId, todasDependencias)) {
    return NextResponse.json(
      { erro: "Isso criaria uma dependência circular (uma tarefa esperando a outra pra sempre) — não é permitido." },
      { status: 409 }
    );
  }

  const dependencia = await prisma.dependenciaTarefa.create({
    data: { tarefaId: tarefa.id, dependeDeId },
    include: { dependeDe: { select: { id: true, titulo: true, prazo: true, status: true } } },
  });

  return NextResponse.json(dependencia, { status: 201 });
}
