import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const tarefa = await prisma.tarefa.update({
    where: { id: params.id },
    data: { status: body.status },
  });

  return NextResponse.json(tarefa);
}
