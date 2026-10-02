import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";

export function calcularMensalidade(cliente: { servicosContratados: { valor: unknown }[]; descontoMensal: unknown; acrescimoMensal: unknown }) {
  const total = cliente.servicosContratados.reduce((s, sc) => s + Math.round(Number(sc.valor) * 100), 0);
  return Math.max(0, total - Math.round(Number(cliente.descontoMensal) * 100) + Math.round(Number(cliente.acrescimoMensal) * 100)) / 100;
}

// Datas civis antigas foram gravadas à meia-noite UTC. Preservamos o dia escrito
// originalmente; timestamps reais (createdAt) continuam no fuso de Brasília.
function mesCivil(data: Date) {
  return data.getUTCHours() === 0 && data.getUTCMinutes() === 0 && data.getUTCSeconds() === 0 && data.getUTCMilliseconds() === 0
    ? data.toISOString().slice(0, 7) : chaveDiaSaoPaulo(data).slice(0, 7);
}
export function competenciaCobranca(c: { dataCompetencia: Date | null; vencimento: Date | null; createdAt: Date }) {
  return c.dataCompetencia ? mesCivil(c.dataCompetencia) : c.vencimento ? mesCivil(c.vencimento) : chaveDiaSaoPaulo(c.createdAt).slice(0, 7);
}
export function vencimentoMensal(mes: string, dia: number) {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
  return new Date(`${mes}-${String(Math.min(Math.max(1, dia), ultimoDia)).padStart(2, "0")}T00:00:00-03:00`);
}

export async function comTravaMensalidade<T>(clienteId: string, executar: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`mensalidade:${clienteId}`}))`;
    return executar(tx);
  }, { maxWait: 15000, timeout: 20000 });
}

export async function sincronizarMensalidadeCliente(clienteId: string, agora = new Date(), atualizarAberta = false) {
  return comTravaMensalidade(clienteId, async tx => {
    const cliente = await tx.cliente.findUnique({
      where: { id: clienteId },
      include: { servicosContratados: { where: { ativo: true } } },
    });
    const mes = chaveDiaSaoPaulo(agora).slice(0, 7);
    if (!cliente || cliente.status !== "ativo" || !cliente.cobrancaRecorrenteAtiva || !cliente.cobrancaRecorrenteInicio || cliente.cobrancaRecorrenteInicio > mes) return null;
    const mensalidade = calcularMensalidade(cliente);
    if (mensalidade <= 0) return null;
    const chave = `${clienteId}:${mes}`;
    const cobrancas = await tx.cobranca.findMany({
      where: { clienteId, OR: [{ tipo: "recorrente" }, { categoria: "Primeira cobrança" }, { recorrenciaChave: chave }] }, include: { pagamentos: true }, orderBy: { createdAt: "asc" },
    });
    const existente = cobrancas.find(c => c.recorrenciaChave === chave) || cobrancas.find(c => competenciaCobranca(c) === mes);
    if (existente) {
      // Cobranças manuais, canceladas, recebidas ou parcialmente baixadas mantêm
      // o combinado original. Só o lançamento automático ainda aberto acompanha
      // o valor atual dos serviços e o dia configurado neste mês.
      if (atualizarAberta && existente.tipo === "recorrente" && existente.recorrenciaChave === chave && ["pendente", "atrasado"].includes(existente.status) && existente.pagamentos.length === 0) {
        const vencimento = vencimentoMensal(mes, cliente.cobrancaDiaVencimento);
        if (Number(existente.valor) !== mensalidade || existente.vencimento?.getTime() !== vencimento.getTime()) {
          return tx.cobranca.update({ where: { id: existente.id }, data: { valor: mensalidade, vencimento } });
        }
      }
      return existente;
    }
    return tx.cobranca.create({ data: {
      clienteId, valor: mensalidade, tipo: "recorrente", categoria: "Mensalidade",
      dataCompetencia: new Date(`${mes}-01T00:00:00-03:00`),
      vencimento: vencimentoMensal(mes, cliente.cobrancaDiaVencimento), status: "pendente", recorrenciaChave: chave,
    } });
  });
}
