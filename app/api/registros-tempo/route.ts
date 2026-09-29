import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, clienteIdsPermitidos, podeVerCliente } from "@/lib/permissoes";

export async function GET(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const idsPermitidos = await clienteIdsPermitidos(usuario);

  const desde = request.nextUrl.searchParams.get("desde");

  const registros = await prisma.registroTempo.findMany({
    where: {
      ...(desde ? { inicio: { gte: new Date(desde) } } : {}),
      ...(idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {}),
    },
    include: { cliente: { select: { nome: true } }, usuario: { select: { nome: true } } },
    orderBy: { inicio: "desc" },
  });

  return NextResponse.json(registros);
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await request.json();

  if (!body.atividade || !body.inicio) {
    return NextResponse.json({ erro: "Atividade e início são obrigatórios" }, { status: 400 });
  }
  if (body.clienteId && !(await podeVerCliente(usuario, body.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  // tarefaId (Etapa 1 v152) — vincula esse cronômetro a uma tarefa específica, o
  // que permite o PATCH de /api/tarefas/[id] fechar esse registro sozinho quando a
  // tarefa for concluída ou bloqueada, evitando hora duplicada (item 9). Confere
  // que a tarefa existe e que quem está lançando pode vê-la, igual às outras rotas.
  let tarefaId: string | null = null;
  if (body.tarefaId) {
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: body.tarefaId },
      select: { id: true, clienteId: true },
    });
    if (!tarefa) {
      return NextResponse.json({ erro: "Essa tarefa não existe mais." }, { status: 400 });
    }
    if (tarefa.clienteId && !(await podeVerCliente(usuario, tarefa.clienteId))) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
    }
    tarefaId = tarefa.id;
  }

  const registro = await prisma.registroTempo.create({
    data: {
      clienteId: body.clienteId || null,
      tarefaId,
      // Sempre a pessoa logada que está lançando — nunca vem do body, pra ninguém
      // conseguir registrar hora em nome de outro alterando o payload da requisição.
      usuarioId: usuario.id,
      atividade: body.atividade,
      inicio: new Date(body.inicio),
      fim: body.fim ? new Date(body.fim) : null,
    },
    include: { cliente: { select: { nome: true } }, usuario: { select: { nome: true } } },
  });

  return NextResponse.json(registro, { status: 201 });
}
