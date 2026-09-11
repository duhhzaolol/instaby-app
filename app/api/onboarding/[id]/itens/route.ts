import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  if (!body.titulo) {
    return NextResponse.json({ erro: "Título é obrigatório" }, { status: 400 });
  }

  const maiorOrdem = await prisma.itemOnboarding.aggregate({
    where: { onboardingId: params.id },
    _max: { ordem: true },
  });

  const item = await prisma.itemOnboarding.create({
    data: {
      onboardingId: params.id,
      titulo: body.titulo,
      responsavel: body.responsavel || "agencia",
      ordem: (maiorOrdem._max.ordem ?? -1) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
