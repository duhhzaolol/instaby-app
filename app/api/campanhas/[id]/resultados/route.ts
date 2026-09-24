import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi, podeVerCliente } from "@/lib/permissoes";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const campanha = await prisma.campanha.findUnique({ where: { id: params.id } });
  if (!campanha) return NextResponse.json({ erro: "Campanha não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, campanha.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const resultados = await prisma.resultadoCampanha.findMany({
    where: { campanhaId: params.id },
    orderBy: { fim: "desc" },
  });

  return NextResponse.json(resultados);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, erro } = await exigirPermissaoApi("gerenciarTrafego");
  if (erro) return erro;

  const campanha = await prisma.campanha.findUnique({ where: { id: params.id } });
  if (!campanha) return NextResponse.json({ erro: "Campanha não encontrada" }, { status: 404 });
  if (!(await podeVerCliente(usuario, campanha.clienteId))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.inicio || !body.fim) {
    return NextResponse.json({ erro: "Início e fim do período são obrigatórios" }, { status: 400 });
  }

  const numOuNulo = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));

  // upsert em vez de create puro: se já existe um resultado importado do Meta pro mesmo
  // período (campanhaId, inicio, fim), lançar manualmente aqui atualiza em vez de dar erro
  const resultado = await prisma.resultadoCampanha.upsert({
    where: {
      campanhaId_inicio_fim: {
        campanhaId: params.id,
        inicio: new Date(body.inicio),
        fim: new Date(body.fim),
      },
    },
    update: {
      verbaInvestida: numOuNulo(body.verbaInvestida),
      impressoes: numOuNulo(body.impressoes),
      cliques: numOuNulo(body.cliques),
      resultados: numOuNulo(body.resultados),
      observacoes: body.observacoes || null,
      origem: "manual",
    },
    create: {
      campanhaId: params.id,
      inicio: new Date(body.inicio),
      fim: new Date(body.fim),
      verbaInvestida: numOuNulo(body.verbaInvestida),
      impressoes: numOuNulo(body.impressoes),
      cliques: numOuNulo(body.cliques),
      resultados: numOuNulo(body.resultados),
      observacoes: body.observacoes || null,
      origem: "manual",
    },
  });

  return NextResponse.json(resultado, { status: 201 });
}
