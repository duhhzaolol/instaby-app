import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { centavosFinanceiros, inicioDiaFinanceiro } from "@/lib/datasFinanceiro";
import { comTravaMensalidade, competenciaCobranca } from "@/lib/mensalidades";

type TipoLancamento = "cobranca" | "despesa";
type Tx = Prisma.TransactionClient;

export class ErroFinanceiro extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem); }
}

export async function transacaoFinanceira<T>(executar: (tx: Tx) => Promise<T>): Promise<T> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      return await prisma.$transaction(executar, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 15000, timeout: 15000,
      });
    } catch (erro) {
      if ((erro as { code?: string })?.code !== "P2034") throw erro;
      if (tentativa === 2) throw new ErroFinanceiro(409, "Outra atualização aconteceu ao mesmo tempo. Confira o saldo e tente novamente.");
    }
  }
  throw new ErroFinanceiro(409, "Não foi possível concluir a atualização.");
}

async function encontrar(tx: Tx, tipo: TipoLancamento, id: string) {
  if (tipo === "cobranca") {
    const vinculo = await tx.cobranca.findUnique({ where: { id }, select: { clienteId: true } });
    if (!vinculo) throw new ErroFinanceiro(404, "Lançamento não encontrado.");
    // A mesma trava usada pelo gerador impede que uma atualização dos serviços
    // altere a mensalidade entre a consulta de saldo e a baixa do pagamento.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`mensalidade:${vinculo.clienteId}`}))`;
  }
  const lancamento = tipo === "cobranca"
    ? await tx.cobranca.findUnique({ where: { id }, include: { pagamentos: true } })
    : await tx.despesa.findUnique({ where: { id }, include: { pagamentos: true } });
  if (!lancamento) throw new ErroFinanceiro(404, "Lançamento não encontrado.");
  return lancamento;
}

function pagoEmCentavos(lancamento: { status: string; valor: unknown; pagamentos: { valor: unknown }[] }) {
  if (lancamento.pagamentos.length === 0 && lancamento.status === "pago") return Math.round(Number(lancamento.valor) * 100);
  return lancamento.pagamentos.reduce((total, p) => total + Math.round(Number(p.valor) * 100), 0);
}

function dataLegadaDePagamento(lancamento: any): Date {
  const civil = "dataRecebimento" in lancamento ? lancamento.dataRecebimento : lancamento.dataPagamento || lancamento.data;
  if (!civil) return lancamento.createdAt;
  return civil.toISOString().endsWith("T00:00:00.000Z") ? inicioDiaFinanceiro(civil) : civil;
}

async function criarPagamento(tx: Tx, tipo: TipoLancamento, id: string, valor: number, data: Date) {
  return tx.pagamento.create({ data: { [tipo === "cobranca" ? "cobrancaId" : "despesaId"]: id, valor: valor / 100, data } });
}

async function atualizar(tx: Tx, tipo: TipoLancamento, id: string, data: Record<string, unknown>) {
  return tipo === "cobranca"
    ? tx.cobranca.update({ where: { id }, data: data as Prisma.CobrancaUncheckedUpdateInput })
    : tx.despesa.update({ where: { id }, data: data as Prisma.DespesaUncheckedUpdateInput });
}

export async function registrarPagamentoFinanceiro(tipo: TipoLancamento, id: string, valor: number, data: Date) {
  return transacaoFinanceira(async tx => {
    const existente = await encontrar(tx, tipo, id);
    if (existente.status === "cancelado" || existente.status === "pago") throw new ErroFinanceiro(409, "Esse lançamento já está pago ou cancelado.");
    const centavos = centavosFinanceiros(valor, true);
    if (centavos === null) throw new ErroFinanceiro(400, "Informe um valor positivo, com até duas casas decimais.");
    const saldo = Math.round(Number(existente.valor) * 100) - pagoEmCentavos(existente);
    if (centavos > saldo) throw new ErroFinanceiro(409, "O pagamento ultrapassa o saldo em aberto.");
    const pagamento = await criarPagamento(tx, tipo, id, centavos, data);
    if (centavos === saldo) await atualizar(tx, tipo, id, {
      status: "pago", [tipo === "cobranca" ? "dataRecebimento" : "dataPagamento"]: data,
    });
    return pagamento;
  });
}

export async function editarLancamentoFinanceiro(tipo: TipoLancamento, id: string, dados: Record<string, unknown>) {
  return transacaoFinanceira(async tx => {
    const existente = await encontrar(tx, tipo, id);
    if (tipo === "despesa" && dados.recorrente === true && "origemRecorrenteId" in existente && existente.origemRecorrenteId) {
      throw new ErroFinanceiro(409, "Esta conta já foi gerada por uma recorrência. Edite a conta original para mudar os próximos meses.");
    }
    const totalPago = pagoEmCentavos(existente);
    if (tipo === "cobranca" && "recorrenciaChave" in existente && existente.recorrenciaChave) {
      const competenciaFinal = competenciaCobranca({ ...existente, ...dados } as any);
      if (competenciaFinal !== existente.recorrenciaChave.slice(-7)) throw new ErroFinanceiro(409, "Mensalidade automática pertence a este mês. Para outro mês, crie um lançamento separado.");
    }
    const valor = dados.valor !== undefined ? centavosFinanceiros(dados.valor) : Math.round(Number(existente.valor) * 100);
    if (valor === null) throw new ErroFinanceiro(400, "Valor inválido.");
    if (valor < totalPago) throw new ErroFinanceiro(409, "O valor não pode ser menor que os pagamentos já registrados.");

    // Ao editar um recebido antigo sem parcelas, registramos o recebimento já
    // existente antes de mudar seu estado. Cancelar/reabrir não apaga o caixa.
    if (existente.status === "pago" && existente.pagamentos.length === 0 && totalPago > 0) {
      await criarPagamento(tx, tipo, id, totalPago, dataLegadaDePagamento(existente));
    }

    const novosDados = { ...dados };
    if (existente.status === "pago" && dados.status === undefined && valor > totalPago) novosDados.status = "pendente";
    if (dados.status === "pago") {
      if (existente.status === "cancelado") throw new ErroFinanceiro(409, "Reabra o lançamento antes de registrar um pagamento.");
      const campoData = tipo === "cobranca" ? "dataRecebimento" : "dataPagamento";
      const data = dados[campoData] instanceof Date ? dados[campoData] as Date : new Date();
      if (valor > totalPago) {
        await criarPagamento(tx, tipo, id, valor - totalPago, data);
        novosDados[campoData] = data;
      }
    }
    return atualizar(tx, tipo, id, novosDados);
  });
}

async function criarDentroDaTransacao(tx: Tx, tipo: TipoLancamento, dados: Record<string, unknown>, aposCriar?: (tx: Tx, lancamento: any) => Promise<void>) {
  const lancamento = tipo === "cobranca"
    ? await tx.cobranca.create({ data: dados as Prisma.CobrancaUncheckedCreateInput })
    : await tx.despesa.create({ data: dados as Prisma.DespesaUncheckedCreateInput });
  if (lancamento.status === "pago" && Number(lancamento.valor) > 0) {
    const data = "dataRecebimento" in lancamento
      ? lancamento.dataRecebimento || lancamento.createdAt
      : lancamento.dataPagamento || lancamento.data;
    await criarPagamento(tx, tipo, lancamento.id, Math.round(Number(lancamento.valor) * 100), data);
  }
  await aposCriar?.(tx, lancamento);
  return lancamento;
}

export async function criarLancamentoFinanceiro(tipo: TipoLancamento, dados: Record<string, unknown>, aposCriar?: (tx: Tx, lancamento: any) => Promise<void>) {
  if (tipo === "cobranca" && dados.tipo === "recorrente") {
    // Compartilha a trava do gerador automático; uma mensalidade manual no mês
    // não disputa espaço com outra manual ou com a geração na navegação.
    return comTravaMensalidade(String(dados.clienteId), async tx => {
      const competencia = competenciaCobranca({
        dataCompetencia: dados.dataCompetencia as Date | null || null,
        vencimento: dados.vencimento as Date | null || null,
        createdAt: dados.createdAt as Date || new Date(),
      });
      const cobrancas = await tx.cobranca.findMany({ where: { clienteId: String(dados.clienteId), tipo: "recorrente", status: { not: "cancelado" } } });
      if (cobrancas.some(c => competenciaCobranca(c) === competencia)) throw new ErroFinanceiro(409, "Já existe uma mensalidade deste cliente para esse mês. Edite a cobrança existente ou use Única para um serviço avulso.");
      return criarDentroDaTransacao(tx, tipo, dados, aposCriar);
    });
  }
  return transacaoFinanceira(tx => criarDentroDaTransacao(tx, tipo, dados, aposCriar));
}

export async function excluirLancamentoFinanceiro(tipo: TipoLancamento, id: string) {
  return transacaoFinanceira(async tx => {
    const existente = await encontrar(tx, tipo, id);
    if (existente.pagamentos.length > 0 || existente.status === "pago") throw new ErroFinanceiro(409, "Esse lançamento tem recebimentos ou pagamentos registrados. Cancele para preservar o histórico.");
    if (tipo === "cobranca" && "recorrenciaChave" in existente && existente.recorrenciaChave) return atualizar(tx, tipo, id, { status: "cancelado" });
    return tipo === "cobranca" ? tx.cobranca.delete({ where: { id } }) : tx.despesa.delete({ where: { id } });
  });
}
