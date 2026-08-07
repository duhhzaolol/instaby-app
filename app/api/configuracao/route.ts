import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.configuracao.findUnique({ where: { id: "config" } });
  return NextResponse.json(config || { id: "config", whatsappAgencia: null });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const config = await prisma.configuracao.upsert({
    where: { id: "config" },
    update: { ...(body.whatsappAgencia !== undefined && { whatsappAgencia: body.whatsappAgencia }) },
    create: { id: "config", whatsappAgencia: body.whatsappAgencia || null },
  });

  return NextResponse.json(config);
}
