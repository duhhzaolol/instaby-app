import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (!body.nome) {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 });
  }

  const contato = await prisma.contato.create({
    data: {
      clienteId: params.id,
      nome: body.nome,
      cargo: body.cargo || null,
      telefone: body.telefone || null,
      whatsapp: body.whatsapp || null,
      email: body.email || null,
      observacoes: body.observacoes || null,
      principal: body.principal || false,
      financeiro: body.financeiro || false,
      aprovacaoConteudo: body.aprovacaoConteudo || false,
      contratos: body.contratos || false,
    },
  });

  return NextResponse.json(contato, { status: 201 });
}
