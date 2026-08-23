import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  return NextResponse.json(config || { id: "config", whatsappAgencia: null, metaFaturamentoMensal: null });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const config = await prisma.configuracao.upsert({
    where: { id: "config" },
    update: {
      ...(body.whatsappAgencia !== undefined && { whatsappAgencia: body.whatsappAgencia }),
      ...(body.metaFaturamentoMensal !== undefined && { metaFaturamentoMensal: body.metaFaturamentoMensal }),
    },
    create: {
      id: "config",
      whatsappAgencia: body.whatsappAgencia || null,
      metaFaturamentoMensal: body.metaFaturamentoMensal || null,
    },
  });

  return NextResponse.json(config);
}
