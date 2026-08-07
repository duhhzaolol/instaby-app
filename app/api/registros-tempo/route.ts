import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const desde = request.nextUrl.searchParams.get("desde");

  const registros = await prisma.registroTempo.findMany({
    where: desde ? { inicio: { gte: new Date(desde) } } : undefined,
    include: { cliente: { select: { nome: true } } },
    orderBy: { inicio: "desc" },
  });

  return NextResponse.json(registros);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.atividade || !body.inicio) {
    return NextResponse.json({ erro: "Atividade e início são obrigatórios" }, { status: 400 });
  }

  const registro = await prisma.registroTempo.create({
    data: {
      clienteId: body.clienteId || null,
      atividade: body.atividade,
      inicio: new Date(body.inicio),
      fim: body.fim ? new Date(body.fim) : null,
    },
    include: { cliente: { select: { nome: true } } },
  });

  return NextResponse.json(registro, { status: 201 });
}
