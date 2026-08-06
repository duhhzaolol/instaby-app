import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const depoimento = await prisma.depoimento.update({
    where: { id: params.id },
    data: { ativo: body.ativo },
  });

  return NextResponse.json(depoimento);
}
