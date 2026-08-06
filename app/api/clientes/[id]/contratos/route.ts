import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  let conteudo = body.conteudo;
  let orcamentoId: string | null = body.orcamentoId || null;

  if (!conteudo && orcamentoId) {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: { itens: { include: { servico: true } } },
    });

    if (orcamento) {
      const total = orcamento.itens.reduce((soma, item) => soma + Number(item.valor), 0);
      const listaServicos = orcamento.itens.map((i) => i.servico.nome).join(", ");
      conteudo = `Contrato de prestação de serviços entre Instaby Agência e ${cliente.nome}.\n\nObjeto: ${listaServicos}.\n\nValor: R$ ${total.toFixed(2)} mensais.\n\nVigência: prazo indeterminado, renovação automática, cancelamento com aviso de 30 dias.`;
    }
  }

  if (!conteudo) {
    return NextResponse.json({ erro: "Informe o conteúdo ou um orçamento aceito" }, { status: 400 });
  }

  const contrato = await prisma.contrato.create({
    data: {
      clienteId: params.id,
      orcamentoId,
      conteudo,
      status: "rascunho",
    },
  });

  return NextResponse.json(contrato, { status: 201 });
}
