import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const links = await prisma.linkBio.findMany({ orderBy: { ordem: "asc" } });
  return NextResponse.json(links);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.titulo || !body.url) {
    return NextResponse.json({ erro: "Título e endereço são obrigatórios" }, { status: 400 });
  }

  const maiorOrdem = await prisma.linkBio.aggregate({ _max: { ordem: true } });

  const item = await prisma.linkBio.create({
    data: {
      titulo: body.titulo,
      url: body.url,
      imagemUrl: body.imagemUrl || null,
      ordem: (maiorOrdem._max.ordem ?? -1) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
