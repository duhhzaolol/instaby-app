import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const relatorios = await prisma.relatorioPeriodo.findMany({
    where: { clienteId: params.id },
    orderBy: { fim: "desc" },
  });
  return NextResponse.json(relatorios);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  if (!body.rede || !body.inicio || !body.fim) {
    return NextResponse.json({ erro: "Rede, início e fim são obrigatórios" }, { status: 400 });
  }

  const numOuNulo = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));

  const relatorio = await prisma.relatorioPeriodo.create({
    data: {
      clienteId: params.id,
      rede: body.rede,
      inicio: new Date(body.inicio),
      fim: new Date(body.fim),
      seguidoresInicio: numOuNulo(body.seguidoresInicio),
      seguidoresFim: numOuNulo(body.seguidoresFim),
      alcance: numOuNulo(body.alcance),
      impressoes: numOuNulo(body.impressoes),
      curtidas: numOuNulo(body.curtidas),
      comentariosQtd: numOuNulo(body.comentariosQtd),
      compartilhamentos: numOuNulo(body.compartilhamentos),
      salvamentos: numOuNulo(body.salvamentos),
      visualizacoes: numOuNulo(body.visualizacoes),
      postsPublicados: numOuNulo(body.postsPublicados),
      reelsPublicados: numOuNulo(body.reelsPublicados),
      investimento: body.investimento ? Number(body.investimento) : null,
      cliques: numOuNulo(body.cliques),
      leads: numOuNulo(body.leads),
      comentarioAgencia: body.comentarioAgencia || null,
    },
  });

  return NextResponse.json(relatorio, { status: 201 });
}
