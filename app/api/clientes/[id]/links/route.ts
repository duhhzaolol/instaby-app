import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (!body.url || !body.tipo) {
    return NextResponse.json({ erro: "Tipo e URL são obrigatórios" }, { status: 400 });
  }

  try {
    const link = await prisma.linkCliente.create({
      data: {
        clienteId: params.id,
        tipo: body.tipo,
        label: body.label || null,
        url: body.url,
      },
    });
    return NextResponse.json(link, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Não deu pra salvar esse link." }, { status: 400 });
  }
}
