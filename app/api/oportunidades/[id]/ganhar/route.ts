import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const oportunidade = await prisma.oportunidade.findUnique({ where: { id: params.id } });
  if (!oportunidade) {
    return NextResponse.json({ erro: "Oportunidade não encontrada" }, { status: 404 });
  }

  if (oportunidade.clienteId) {
    // já foi convertida antes — não cria de novo, só devolve o cliente que já existe
    return NextResponse.json({ clienteId: oportunidade.clienteId, jaExistia: true });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome: oportunidade.nome,
      contatoNome: oportunidade.contatoNome || null,
      whatsapp: oportunidade.contatoWhatsapp || null,
      status: "lead", // segue o fluxo normal: orçamento → aceite → vira ativo sozinho
    },
  });

  await prisma.oportunidade.update({
    where: { id: params.id },
    data: { status: "ganho", clienteId: cliente.id },
  });

  return NextResponse.json({ clienteId: cliente.id, jaExistia: false }, { status: 201 });
}
