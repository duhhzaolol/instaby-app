import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const minutos = Number(body.minutos);

  if (!minutos || minutos <= 0) {
    return NextResponse.json({ erro: "Informe quantos minutos foram gastos" }, { status: 400 });
  }

  const item = await prisma.itemOnboarding.findUnique({
    where: { id: params.id },
    include: { onboarding: true },
  });
  if (!item) {
    return NextResponse.json({ erro: "Item não encontrado" }, { status: 404 });
  }

  const fim = new Date();
  const inicio = new Date(fim.getTime() - minutos * 60 * 1000);

  const registro = await prisma.registroTempo.create({
    data: {
      clienteId: item.onboarding.clienteId,
      atividade: `Onboarding — ${item.titulo}`,
      inicio,
      fim,
    },
  });

  const atualizado = await prisma.itemOnboarding.update({
    where: { id: params.id },
    data: { registroTempoId: registro.id },
  });

  return NextResponse.json(atualizado);
}
