import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: { tarefas: { orderBy: { createdAt: "desc" } } },
  });

  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      ...(body.nome !== undefined && { nome: body.nome }),
      ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp }),
      ...(body.cnpj !== undefined && { cnpj: body.cnpj }),
      ...(body.contatoNome !== undefined && { contatoNome: body.contatoNome }),
      ...(body.endereco !== undefined && { endereco: body.endereco }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
      ...(body.linkDrive !== undefined && { linkDrive: body.linkDrive }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.descontoMensal !== undefined && { descontoMensal: body.descontoMensal }),
      ...(body.prazoContratoMeses !== undefined && {
        prazoContratoMeses: body.prazoContratoMeses ? parseInt(body.prazoContratoMeses) : null,
      }),
      ...(body.valorRenovacao !== undefined && {
        valorRenovacao: body.valorRenovacao || null,
      }),
      ...(body.exibirLogoPublico !== undefined && { exibirLogoPublico: body.exibirLogoPublico }),
      ...(body.cor !== undefined && { cor: body.cor }),
    },
  });

  if (body.status === "ativo" && body.mensalidade && body.proximoVencimento) {
    await prisma.cobranca.create({
      data: {
        clienteId: cliente.id,
        valor: parseFloat(body.mensalidade),
        tipo: "recorrente",
        status: "pendente",
        vencimento: new Date(body.proximoVencimento),
      },
    });
  }

  return NextResponse.json(cliente);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const orcamentos = await prisma.orcamento.findMany({ where: { clienteId: id }, select: { id: true } });
  const orcamentoIds = orcamentos.map((o) => o.id);

  await prisma.$transaction([
    prisma.itemOrcamento.deleteMany({ where: { orcamentoId: { in: orcamentoIds } } }),
    prisma.contrato.deleteMany({ where: { clienteId: id } }),
    prisma.cobranca.deleteMany({ where: { clienteId: id } }),
    prisma.despesa.deleteMany({ where: { clienteId: id } }),
    prisma.tarefa.deleteMany({ where: { clienteId: id } }),
    prisma.orcamento.deleteMany({ where: { clienteId: id } }),
    prisma.cliente.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
