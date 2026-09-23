import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, podeVerCliente } from "@/lib/permissoes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const existente = await prisma.registroTempo.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (existente.clienteId && !(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  const registro = await prisma.registroTempo.update({
    where: { id: params.id },
    data: {
      ...(body.atividade !== undefined && { atividade: body.atividade }),
      ...(body.clienteId !== undefined && { clienteId: body.clienteId || null }),
      ...(body.inicio !== undefined && { inicio: new Date(body.inicio) }),
      ...(body.fim !== undefined && { fim: body.fim ? new Date(body.fim) : null }),
    },
    include: { cliente: { select: { nome: true } } },
  });

  return NextResponse.json(registro);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const existente = await prisma.registroTempo.findUnique({ where: { id: params.id } });
  if (existente?.clienteId && !(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.registroTempo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
