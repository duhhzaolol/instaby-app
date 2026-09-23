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
    include: { cliente: { select: { nome: true } } },
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

  const registro = await prisma.registroTempo.create({
    data: {
      clienteId: body.clienteId || null,
      atividade: body.atividade,
      inicio: new Date(body.inicio),
      fim: body.fim ? new Date(body.fim) : null,
    },
    include: { cliente: { select: { nome: true } } },
  });

  return NextResponse.json(registro, { status: 201 });
}
