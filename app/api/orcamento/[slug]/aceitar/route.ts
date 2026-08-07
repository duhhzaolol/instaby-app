import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({ itens: [] }));
  const itensAjustados: { id: string; quantidade: number; valor: number }[] = body.itens || [];

  const orcamento = await prisma.orcamento.findUnique({
    where: { slug: params.slug },
    include: { itens: true },
  });

  if (!orcamento) {
    return NextResponse.json({ erro: "Orçamento não encontrado" }, { status: 404 });
  }

  const idsValidos = new Set(orcamento.itens.map((i) => i.id));
  const atualizacoesValidas = itensAjustados.filter((i) => idsValidos.has(i.id));

  const operacoes = atualizacoesValidas
    .filter((i) => i.quantidade > 0)
    .map((i) =>
      prisma.itemOrcamento.update({
        where: { id: i.id },
        data: { quantidade: i.quantidade, valor: i.valor },
      })
    );

  const idsParaRemover = atualizacoesValidas.filter((i) => i.quantidade === 0).map((i) => i.id);
  if (idsParaRemover.length > 0) {
    operacoes.push(prisma.itemOrcamento.deleteMany({ where: { id: { in: idsParaRemover } } }) as any);
  }

  if (operacoes.length > 0) {
    await prisma.$transaction(operacoes as any);
  }

  const itensFinais = await prisma.itemOrcamento.findMany({ where: { orcamentoId: orcamento.id } });
  const total = itensFinais.reduce((soma, item) => soma + Number(item.valor), 0);

  const [orcamentoAtualizado] = await prisma.$transaction([
    prisma.orcamento.update({
      where: { id: orcamento.id },
      data: { status: "aceito" },
    }),
    prisma.cobranca.create({
      data: {
        clienteId: orcamento.clienteId,
        orcamentoId: orcamento.id,
        valor: total,
        tipo: "recorrente",
        status: "pendente",
      },
    }),
    prisma.cliente.update({
      where: { id: orcamento.clienteId },
      data: { status: "ativo" },
    }),
  ]);

  return NextResponse.json(orcamentoAtualizado);
}
