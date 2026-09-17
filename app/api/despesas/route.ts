import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const despesas = await prisma.despesa.findMany({
    orderBy: { data: "desc" },
    include: { cliente: true },
    take: 50,
  });
  return NextResponse.json(despesas);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.descricao || !body.valor) {
    return NextResponse.json({ erro: "Descrição e valor são obrigatórios" }, { status: 400 });
  }

  const despesa = await prisma.despesa.create({
    data: {
      descricao: body.descricao,
      valor: body.valor,
      clienteId: body.clienteId || null,
      tipo: body.tipo || "flexivel",
      categoriaFinanceira: body.categoriaFinanceira || null,
      categoria: body.categoria || null,
      subcategoria: body.subcategoria || null,
      recorrente: body.recorrente || false,
      status: body.status || "pago",
      vencimento: body.vencimento ? new Date(body.vencimento) : null,
      dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : null,
      data: body.data ? new Date(body.data) : new Date(),
    },
  });

  // Se foi lançada como Investimento/Ativo e marcou pra entrar no patrimônio,
  // já nasce o bem vinculado a essa despesa (não muda em nada a despesa em si).
  if (body.categoriaFinanceira === "investimento" && body.adicionarAoPatrimonio) {
    await prisma.patrimonio.create({
      data: {
        nome: body.descricao,
        categoria: body.categoria || null,
        valorAquisicao: body.valor,
        valorAtual: body.valor,
        data: despesa.data,
        despesaOrigemId: despesa.id,
      },
    });
  }

  return NextResponse.json(despesa, { status: 201 });
}
