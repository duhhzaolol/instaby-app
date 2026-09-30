import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";

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
  // Permissão no servidor (Etapa 4 v158, achado ao ligar o toggle de pausa de
  // rotinas): essa rota só exigia sessão (middleware) — qualquer pessoa logada
  // podia alterar qualquer cliente, inclusive desconto/renovação. Agora: precisa
  // poder ver ESSE cliente (ou ter gerenciarConfiguracoes, caso de Logos na
  // proposta); campos de valor/contrato exigem verFinanceiro; pausar rotinas exige
  // verFinanceiro ou acessoClienteCompleto (quem enxerga a aba Serviços/Tarefas).
  const usuario = await getUsuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  const pode = permissoesDe(usuario);
  if (!pode.gerenciarConfiguracoes && !(await podeVerCliente(usuario, params.id))) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();

  const camposFinanceiros = [
    "descontoMensal",
    "acrescimoMensal",
    "prazoContratoMeses",
    "dataInicioContrato",
    "valorRenovacao",
    "mensalidade",
    "proximoVencimento",
  ];
  if (!pode.verFinanceiro && camposFinanceiros.some((c) => body[c] !== undefined)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (body.rotinasPausadas !== undefined && !pode.verFinanceiro && !pode.acessoClienteCompleto) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

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
      ...(body.acrescimoMensal !== undefined && { acrescimoMensal: body.acrescimoMensal }),
      ...(body.prazoContratoMeses !== undefined && {
        prazoContratoMeses: body.prazoContratoMeses ? parseInt(body.prazoContratoMeses) : null,
      }),
      ...(body.dataInicioContrato !== undefined && {
        dataInicioContrato: body.dataInicioContrato ? new Date(body.dataInicioContrato) : null,
      }),
      ...(body.valorRenovacao !== undefined && {
        valorRenovacao: body.valorRenovacao || null,
      }),
      ...(body.exibirLogoPublico !== undefined && { exibirLogoPublico: body.exibirLogoPublico }),
      ...(body.cor !== undefined && { cor: body.cor }),
      ...(body.rotinasPausadas !== undefined && { rotinasPausadas: !!body.rotinasPausadas }),
      ...(body.redesGerenciadas !== undefined && { redesGerenciadas: body.redesGerenciadas }),
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
