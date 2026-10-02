import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPermissaoApi } from "@/lib/permissoes";
import { dataIsoValida, dataIsoParaDate } from "@/lib/midiaRevisao";

export async function GET() {
  const { erro } = await exigirPermissaoApi("verFinanceiro");
  if (erro) return erro;

  const patrimonio = await prisma.patrimonio.findMany({
    orderBy: { data: "desc" },
    include: { despesaOrigem: true },
  });
  return NextResponse.json(patrimonio);
}

export async function POST(request: NextRequest) {
  const { erro } = await exigirPermissaoApi("gerenciarFinanceiro");
  if (erro) return erro;

  const body = await request.json();

  if (!body.nome || !body.valorAquisicao) {
    return NextResponse.json({ erro: "Nome e valor de aquisição são obrigatórios" }, { status: 400 });
  }
  if (!Number.isFinite(Number(body.valorAquisicao)) || Number(body.valorAquisicao) <= 0 ||
      (body.valorAtual !== undefined && (!Number.isFinite(Number(body.valorAtual)) || Number(body.valorAtual) < 0)) ||
      (body.status !== undefined && !["em_uso", "vendido", "baixado"].includes(body.status)) ||
      (body.data && !dataIsoValida(body.data))) return NextResponse.json({ erro: "Confira os valores, a data e a situação do bem." }, { status: 400 });

  const bem = await prisma.patrimonio.create({
    data: {
      nome: body.nome,
      categoria: body.categoria || null,
      valorAquisicao: body.valorAquisicao,
      valorAtual: body.valorAtual ?? body.valorAquisicao,
      data: body.data ? dataIsoParaDate(body.data)! : new Date(),
      status: body.status || "em_uso",
    },
  });

  return NextResponse.json(bem, { status: 201 });
}
