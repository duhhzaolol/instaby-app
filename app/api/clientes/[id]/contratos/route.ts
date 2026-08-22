import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { servicosContratados: { where: { ativo: true }, include: { servico: true } } },
  });
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

  // Gera a partir dos Serviços Contratados — cada serviço entra com a cláusula
  // pronta que foi cadastrada no catálogo (ou a descrição, se não tiver cláusula própria).
  if (!conteudo && body.fonte === "servicos" && cliente.servicosContratados.length > 0) {
    const totalServicos = cliente.servicosContratados.reduce((s, sc) => s + Number(sc.valor), 0);
    const desconto = Number(cliente.descontoMensal);
    const acrescimo = Number(cliente.acrescimoMensal);
    const valorFinal = Math.max(0, totalServicos - desconto + acrescimo);

    const clausulasServicos = cliente.servicosContratados
      .map((sc, i) => {
        const texto = sc.servico.clausulaContrato || sc.servico.descricao;
        const qtd = sc.quantidade > 1 ? ` (quantidade: ${sc.quantidade})` : "";
        return `${i + 1}. ${sc.servico.nome}${qtd}\n${texto}`;
      })
      .join("\n\n");

    let linhaValor = `Valor: R$ ${valorFinal.toFixed(2)} mensais.`;
    if (desconto > 0 && acrescimo > 0) {
      linhaValor = `Valor: R$ ${totalServicos.toFixed(2)} em serviços, com desconto comercial de R$ ${desconto.toFixed(2)} e acréscimo de R$ ${acrescimo.toFixed(2)}, totalizando R$ ${valorFinal.toFixed(2)} mensais.`;
    } else if (desconto > 0) {
      linhaValor = `Valor: R$ ${totalServicos.toFixed(2)} em serviços, com desconto comercial de R$ ${desconto.toFixed(2)}, totalizando R$ ${valorFinal.toFixed(2)} mensais.`;
    } else if (acrescimo > 0) {
      linhaValor = `Valor: R$ ${totalServicos.toFixed(2)} em serviços, com acréscimo de R$ ${acrescimo.toFixed(2)}, totalizando R$ ${valorFinal.toFixed(2)} mensais.`;
    }

    const linhaPrazo = cliente.prazoContratoMeses
      ? `Vigência: ${cliente.prazoContratoMeses} meses a partir da assinatura.`
      : `Vigência: prazo indeterminado, cancelamento com aviso de 30 dias.`;

    const linhaRenovacao = cliente.valorRenovacao
      ? ` Após esse período, o contrato pode ser renovado pelo valor de R$ ${Number(cliente.valorRenovacao).toFixed(2)} mensais.`
      : "";

    conteudo = `Contrato de prestação de serviços entre Instaby Agência e ${cliente.nome}.\n\nServiços contratados:\n\n${clausulasServicos}\n\n${linhaValor}\n\n${linhaPrazo}${linhaRenovacao}`;
  }

  if (!conteudo) {
    return NextResponse.json(
      { erro: "Informe o conteúdo, um orçamento aceito, ou tenha serviços contratados cadastrados" },
      { status: 400 }
    );
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
