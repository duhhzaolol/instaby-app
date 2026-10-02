import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual, permissoesDe, podeVerCliente } from "@/lib/permissoes";
import { comTravaMensalidade, sincronizarMensalidadeCliente } from "@/lib/mensalidades";
import { dataIsoValida, dataIsoParaDate } from "@/lib/midiaRevisao";

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
    "cobrancaRecorrenteAtiva", "cobrancaRecorrenteInicio", "cobrancaDiaVencimento",
  ];
  if (!pode.verFinanceiro && camposFinanceiros.some((c) => body[c] !== undefined)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if (Number(body.mensalidade) > 0 && !pode.gerenciarFinanceiro) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  const camposRecorrencia = ["cobrancaRecorrenteAtiva", "cobrancaRecorrenteInicio", "cobrancaDiaVencimento"];
  if (!pode.gerenciarFinanceiro && camposRecorrencia.some(c => body[c] !== undefined)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }
  if ((body.cobrancaRecorrenteAtiva !== undefined && typeof body.cobrancaRecorrenteAtiva !== "boolean") ||
      (body.cobrancaRecorrenteInicio !== undefined && body.cobrancaRecorrenteInicio !== null && !/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(body.cobrancaRecorrenteInicio)) ||
      (body.cobrancaDiaVencimento !== undefined && (!Number.isInteger(body.cobrancaDiaVencimento) || body.cobrancaDiaVencimento < 1 || body.cobrancaDiaVencimento > 31))) {
    return NextResponse.json({ erro: "Confira o mês inicial e o dia de vencimento." }, { status: 400 });
  }
  for (const campo of ["descontoMensal", "acrescimoMensal", "mensalidade"]) {
    if (body[campo] !== undefined && (!Number.isFinite(Number(body[campo])) || Number(body[campo]) < 0)) {
      return NextResponse.json({ erro: "Informe um valor válido." }, { status: 400 });
    }
  }
  if (body.proximoVencimento && !dataIsoValida(body.proximoVencimento)) {
    return NextResponse.json({ erro: "Informe um vencimento válido." }, { status: 400 });
  }
  if (body.rotinasPausadas !== undefined && !pode.verFinanceiro && !pode.acessoClienteCompleto) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const cliente = await comTravaMensalidade(params.id, async tx => {
    const anterior = await tx.cliente.findUnique({ where: { id: params.id } });
    if (!anterior) return null;
    const ativa = body.cobrancaRecorrenteAtiva ?? anterior.cobrancaRecorrenteAtiva;
    const inicio = body.cobrancaRecorrenteInicio !== undefined ? body.cobrancaRecorrenteInicio : anterior.cobrancaRecorrenteInicio;
    if (ativa && !inicio) throw new Error("MES_INICIAL_OBRIGATORIO");
    const atualizado = await tx.cliente.update({
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
      ...(body.cobrancaRecorrenteAtiva !== undefined && { cobrancaRecorrenteAtiva: body.cobrancaRecorrenteAtiva }),
      ...(body.cobrancaRecorrenteInicio !== undefined && { cobrancaRecorrenteInicio: body.cobrancaRecorrenteInicio }),
      ...(body.cobrancaDiaVencimento !== undefined && { cobrancaDiaVencimento: body.cobrancaDiaVencimento }),
      ...(body.redesGerenciadas !== undefined && { redesGerenciadas: body.redesGerenciadas }),
    },
    });
  if (!ativa && anterior.status !== "ativo" && body.status === "ativo" && Number(body.mensalidade) > 0 && body.proximoVencimento) {
    await tx.cobranca.create({
      data: {
        clienteId: atualizado.id,
        valor: parseFloat(body.mensalidade),
        tipo: "unica",
        categoria: "Primeira cobrança",
        status: "pendente",
        vencimento: dataIsoParaDate(body.proximoVencimento),
      },
    });
  }
    return atualizado;
  }).catch(error => {
    if (error instanceof Error && error.message === "MES_INICIAL_OBRIGATORIO") return "MES_INICIAL_OBRIGATORIO" as const;
    throw error;
  });
  if (cliente === "MES_INICIAL_OBRIGATORIO") return NextResponse.json({ erro: "Escolha o mês inicial da recorrência." }, { status: 400 });
  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado" }, { status: 404 });
  if (camposFinanceiros.some(c => body[c] !== undefined) || body.status !== undefined) await sincronizarMensalidadeCliente(cliente.id, undefined, true);

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
