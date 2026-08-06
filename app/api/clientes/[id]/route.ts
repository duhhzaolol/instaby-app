import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { tarefas: { orderBy: { createdAt: "desc" } } },
  });

  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp }),
      ...(body.cnpj !== undefined && { cnpj: body.cnpj }),
      ...(body.contatoNome !== undefined && { contatoNome: body.contatoNome }),
      ...(body.endereco !== undefined && { endereco: body.endereco }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  if (body.status === "ativo" && body.mensalidade && body.proximoVencimento) {
    await prisma.cobranca.create({
      data: {
        clienteId: cliente.id,
        valor: parseFloat(body.mensalidade),
        tipo: "recorrente",
        status: "pendente",
        vencimento: new Date(body.proximoVencimento),
      },
    });
  }

  return NextResponse.json(cliente);
}
