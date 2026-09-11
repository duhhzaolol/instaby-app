import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_ONBOARDING } from "@/lib/onboardingTemplate";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existente = await prisma.onboarding.findUnique({ where: { clienteId: params.id } });
  if (existente) {
    return NextResponse.json({ erro: "Esse cliente já tem um onboarding." }, { status: 400 });
  }

  const onboarding = await prisma.onboarding.create({
    data: {
      clienteId: params.id,
      itens: {
        create: TEMPLATE_ONBOARDING.map((titulo, i) => ({ titulo, ordem: i })),
      },
    },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  return NextResponse.json(onboarding, { status: 201 });
}
