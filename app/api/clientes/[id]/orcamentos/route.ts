import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarSlug } from "@/lib/slug";
import { exigirPermissaoApi } from "@/lib/permissoes";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verOrcamentos");
  if (erro) return erro;

  const orcamentos = await prisma.orcamento.findMany({
    where: { clienteId: params.id },
    include: { itens: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orcamentos);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { erro } = await exigirPermissaoApi("verOrcamentos");
  if (erro) return erro;

  const body = await request.json();
  // body.itens = [{ servicoId, quantidade, valor }]

  if (!body.itens || body.itens.length === 0) {
    return NextResponse.json({ erro: "Selecione ao menos um serviço" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  const servicos = await prisma.servico.findMany({
    where: { id: { in: body.itens.map((i: any) => i.servicoId) } },
  });
  const servicoPorId = new Map(servicos.map((s) => [s.id, s]));

  const orcamento = await prisma.orcamento.create({
    data: {
      clienteId: params.id,
      slug: gerarSlug(cliente.nome),
      status: "pendente",
      enviadoEm: new Date(),
      itens: {
        create: body.itens.map((item: { servicoId: string; quantidade: number; valor: number }) => ({
          servicoId: item.servicoId,
          quantidade: item.quantidade,
          valor: item.valor,
          nomeServico: servicoPorId.get(item.servicoId)?.nome || null,
          descricaoServico: servicoPorId.get(item.servicoId)?.descricao || null,
        })),
      },
    },
    include: { itens: true },
  });

  return NextResponse.json(orcamento, { status: 201 });
}
