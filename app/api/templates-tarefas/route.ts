import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.templateTarefas.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.nome || !Array.isArray(body.itens) || body.itens.length === 0) {
    return NextResponse.json({ erro: "Nome e ao menos um item são obrigatórios" }, { status: 400 });
  }

  const template = await prisma.templateTarefas.create({
    data: { nome: body.nome, itens: body.itens },
  });

  return NextResponse.json(template, { status: 201 });
}
