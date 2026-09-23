import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const existente = await prisma.campanha.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  const campanha = await prisma.campanha.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.plataforma !== undefined && { plataforma: body.plataforma }),
      ...(body.objetivo !== undefined && { objetivo: body.objetivo || null }),
      ...(body.verbaMensal !== undefined && { verbaMensal: body.verbaMensal }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.dataInicio !== undefined && { dataInicio: new Date(body.dataInicio) }),
      ...(body.dataFim !== undefined && { dataFim: body.dataFim ? new Date(body.dataFim) : null }),
      ...(body.observacoes !== undefined && { observacoes: body.observacoes || null }),
    },
    include: { cliente: { select: { id: true, nome: true, cor: true } } },
  });

  return NextResponse.json(campanha);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const existente = await prisma.campanha.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, existente.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  await prisma.campanha.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
