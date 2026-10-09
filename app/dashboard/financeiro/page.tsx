import { prisma } from "@/lib/prisma";
import FinanceiroClient from "@/components/dashboard/FinanceiroClient";
import { faixaPeriodo } from "@/lib/periodoFinanceiro";
import { movimentosFinanceiros, saldoEmPeriodo } from "@/lib/movimentosFinanceiros";
import { diaFinanceiro, inicioDiaFinanceiro, limitesMesFinanceiro, formatarDataFinanceira } from "@/lib/datasFinanceiro";
import { calcularStatusEfetivo } from "@/lib/statusFinanceiro";
import { garantirDespesasRecorrentesDoMes } from "@/lib/garantirRecorrentes";
import { despesaDaOperacao } from "@/lib/classificacaoDespesa";
import { resumirCustosFinanceiros } from "@/lib/resumoCustosFinanceiros";
import { preverDespesasRecorrentes, proximoMesFinanceiro } from "@/lib/previsaoDespesasRecorrentes";
import { exigirPermissao } from "@/lib/permissoes";

const NOMES_MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const soma = (valores: number[]) => valores.reduce((total, valor) => total + Math.round(valor * 100), 0) / 100;

export default async function FinanceiroPage({ searchParams }: {
  searchParams: { periodo?: string; desde?: string; ate?: string };
}) {
  await exigirPermissao("verFinanceiro");
  const periodo = searchParams.periodo || "mes_atual";
  const hoje = new Date();
  const { desde, ate, meses } = faixaPeriodo(periodo, { desde: searchParams.desde, ate: searchParams.ate }, hoje);
  await garantirDespesasRecorrentesDoMes(hoje);
  // Uma obrigação antiga pode receber uma parcela agora; não filtramos as
  // parcelas pela data de criação da cobrança nem pela competência da despesa.
  const [cobrancasTodas, despesasTodas, clientes, patrimonioAtivo] = await Promise.all([
    prisma.cobranca.findMany({ include: { cliente: true, pagamentos: true }, orderBy: { createdAt: "desc" } }),
    prisma.despesa.findMany({ include: { cliente: true, pagamentos: true }, orderBy: { data: "desc" } }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.patrimonio.aggregate({ where: { status: "em_uso" }, _sum: { valorAtual: true } }),
  ]);
  const movimentos = movimentosFinanceiros(cobrancasTodas, despesasTodas);
  const noPeriodo = movimentos.filter(m => m.data >= desde && m.data <= ate && m.data <= hoje);
  const entradas = noPeriodo.filter(m => m.tipo === "entrada");
  const saidasOperacionais = noPeriodo.filter(m => m.tipo === "saida" && despesaDaOperacao(m));
  const totalEntradas = soma(entradas.map(m => m.valor));
  const totalFixas = soma(saidasOperacionais.filter(m => m.tipoDespesa === "fixa").map(m => m.valor));
  const totalFlexiveis = soma(saidasOperacionais.filter(m => m.tipoDespesa !== "fixa").map(m => m.valor));
  const saldoAtual = soma(movimentos.filter(m => m.data <= hoje).map(m => m.tipo === "entrada" ? m.valor : -m.valor));
  const patrimonioTotal = Number(patrimonioAtivo._sum.valorAtual || 0);
  const atual = faixaPeriodo("mes_atual", undefined, hoje);
  const variacaoCaixaMesDados = saldoEmPeriodo(movimentos, atual.desde, new Date(Math.min(atual.ate.getTime(), hoje.getTime())));
  const variacaoCaixaMes = variacaoCaixaMesDados.totalEntradas - variacaoCaixaMesDados.totalSaidas;

  const fimMesAtual = new Date(limitesMesFinanceiro(diaFinanceiro(hoje, false).slice(0, 7)).fim.getTime() - 1);
  const contasAteFimMes = soma(despesasTodas.filter(d => d.status !== "cancelado" &&
    inicioDiaFinanceiro(d.vencimento || d.data) >= atual.desde && inicioDiaFinanceiro(d.vencimento || d.data) <= fimMesAtual)
    .map(d => {
      const pago = soma(movimentos.filter(m => m.tipo === "saida" && m.origemId === d.id && m.data <= hoje).map(m => m.valor));
      return Math.max(0, Number(d.valor) - pago);
    }));

  // As chaves incluem o ano e o gráfico acompanha o fim do período escolhido.
  const mesesGrafico = Math.max(meses, 6);
  const [anoFinal, mesFinal] = diaFinanceiro(ate, false).split("-").map(Number);
  const mensal = new Map<string, { mes: string; entradas: number; despesasFixas: number; despesasFlexiveis: number }>();
  for (let i = mesesGrafico - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anoFinal, mesFinal - 1 - i, 1));
    const chave = d.toISOString().slice(0, 7);
    mensal.set(chave, { mes: `${NOMES_MESES[d.getUTCMonth()]}/${String(d.getUTCFullYear()).slice(-2)}`, entradas: 0, despesasFixas: 0, despesasFlexiveis: 0 });
  }
  for (const m of movimentos) {
    if (m.data > ate || m.data > hoje) continue;
    const balde = mensal.get(diaFinanceiro(m.data, false).slice(0, 7));
    if (!balde) continue;
    if (m.tipo === "entrada") balde.entradas = soma([balde.entradas, m.valor]);
    else if (despesaDaOperacao(m)) {
      if (m.tipoDespesa === "fixa") balde.despesasFixas = soma([balde.despesasFixas, m.valor]);
      else balde.despesasFlexiveis = soma([balde.despesasFlexiveis, m.valor]);
    }
  }
  let graficoDiario: { dia: number; entradas: number; lucro: number }[] | null = null;
  if (periodo === "mes_atual" || periodo === "mes_anterior") {
    const ultimoDia = Number(diaFinanceiro(ate, false).slice(8));
    const porDia = new Map<number, { entradas: number; saidas: number }>();
    for (const m of noPeriodo) {
      const dia = Number(diaFinanceiro(m.data, false).slice(8));
      const balde = porDia.get(dia) || { entradas: 0, saidas: 0 };
      if (m.tipo === "entrada") balde.entradas = soma([balde.entradas, m.valor]);
      else if (despesaDaOperacao(m)) balde.saidas = soma([balde.saidas, m.valor]);
      porDia.set(dia, balde);
    }
    let acumuladoEntradas = 0, acumuladoCustos = 0;
    graficoDiario = Array.from({ length: ultimoDia }, (_, i) => {
      const dia = i + 1, balde = porDia.get(dia);
      acumuladoEntradas = soma([acumuladoEntradas, balde?.entradas || 0]);
      acumuladoCustos = soma([acumuladoCustos, balde?.saidas || 0]);
      return { dia, entradas: acumuladoEntradas, lucro: soma([acumuladoEntradas, -acumuladoCustos]) };
    });
  }
  const porCliente = new Map<string, { nome: string; cor: string | null; entradas: number; despesas: number }>();
  for (const m of noPeriodo) {
    if (!m.clienteId || (m.tipo === "saida" && !despesaDaOperacao(m))) continue;
    const c = porCliente.get(m.clienteId) || { nome: m.clienteNome || "Cliente", cor: m.clienteCor || null, entradas: 0, despesas: 0 };
    if (m.tipo === "entrada") c.entradas = soma([c.entradas, m.valor]); else c.despesas = soma([c.despesas, m.valor]);
    porCliente.set(m.clienteId, c);
  }
  const resumoPorCliente = Array.from(porCliente.values()).map(c => ({ ...c, lucro: soma([c.entradas, -c.despesas]) })).sort((a, b) => b.entradas - a.entradas);
  // As listas mostram as obrigações de todo o mês; o caixa acima vai até hoje.
  const ateCustos = periodo === "mes_atual" ? fimMesAtual : ate;
  const custos = resumirCustosFinanceiros(despesasTodas, desde, ateCustos, hoje);
  const ordenarVencimento = <T extends { data: Date; vencimento: Date | null }>(itens: T[]) => itens.sort((a, b) =>
    (a.vencimento || a.data).getTime() - (b.vencimento || b.data).getTime());
  const custosFixos = ordenarVencimento(custos.operacionais.itens), custosFlexiveis = ordenarVencimento(custos.flexiveis.itens);
  const mesPrevisao = proximoMesFinanceiro(hoje);
  const previsaoOperacional = preverDespesasRecorrentes(despesasTodas, mesPrevisao, hoje).filter(d => despesaDaOperacao(d) && d.categoriaFinanceira === "despesa_fixa");
  const cobrancasPendentes = cobrancasTodas.flatMap(c => {
    const totalPago = soma(c.pagamentos.map(p => Number(p.valor)));
    const status = calcularStatusEfetivo({ status: c.status, valor: Number(c.valor), totalPago, vencimento: c.vencimento }, hoje);
    return status === "pago" || status === "cancelado" ? [] : [{ ...c, status: status === "parcial" ? "pendente" : status, saldo: Math.max(0, Number(c.valor) - totalPago) }];
  }).sort((a, b) => (a.vencimento?.getTime() || Infinity) - (b.vencimento?.getTime() || Infinity));
  const movimentosMes = movimentos.filter(m => m.data >= atual.desde && m.data <= atual.ate && m.data <= hoje).map(m => ({
    dia: Number(diaFinanceiro(m.data, false).slice(8)), tipo: m.tipo, valor: m.valor, descricao: m.descricao, cliente: m.clienteNome || null,
  }));
  const [anoAtual, mesAtual] = diaFinanceiro(hoje, false).split("-").map(Number);
  return (
    <FinanceiroClient
      periodo={periodo}
      resumo={{ entradas: totalEntradas, despesasFixas: totalFixas, despesasFlexiveis: totalFlexiveis, lucro: soma([totalEntradas, -totalFixas, -totalFlexiveis]) }}
      grafico={Array.from(mensal.values())}
      graficoDiario={graficoDiario}
      cobrancasPendentes={cobrancasPendentes.map(c => ({ id: c.id, cliente: c.cliente.nome, clienteWhatsapp: c.cliente.whatsapp, valor: c.saldo, status: c.status, tipo: c.tipo, vencimento: c.vencimento?.toISOString() || null }))}
      custosFixos={custosFixos.map(d => ({ id: d.id, descricao: d.descricao, valor: Number(d.valor), cliente: d.cliente?.nome || null, data: d.data.toISOString(), recorrente: d.recorrente || !!d.origemRecorrenteId, origemRecorrenteId: d.origemRecorrenteId, categoriaFinanceira: d.categoriaFinanceira, categoria: d.categoria, status: d.status, vencimento: d.vencimento?.toISOString() || null, totalPago: soma(d.pagamentos.map(p => Number(p.valor))) }))}
      custosFlexiveis={custosFlexiveis.map(d => ({ id: d.id, descricao: d.descricao, valor: Number(d.valor), cliente: d.cliente?.nome || null, data: d.data.toISOString(), recorrente: d.recorrente || !!d.origemRecorrenteId, origemRecorrenteId: d.origemRecorrenteId, categoriaFinanceira: d.categoriaFinanceira, categoria: d.categoria, status: d.status, vencimento: d.vencimento?.toISOString() || null, totalPago: soma(d.pagamentos.map(p => Number(p.valor))) }))}
      clientes={clientes} resumoPorCliente={resumoPorCliente} movimentosMes={movimentosMes} mesAtual={mesAtual - 1} anoAtual={anoAtual}
      caixa={{ saldoAtual, contasAteFimMes, variacaoCaixaMes, patrimonioTotal }}
      custosResumo={{
        periodo: `${formatarDataFinanceira(desde)} – ${formatarDataFinanceira(ateCustos)}`,
        operacionais: { total: custos.operacionais.total, pago: custos.operacionais.pago, emAberto: custos.operacionais.emAberto },
        flexiveis: { total: custos.flexiveis.total, pago: custos.flexiveis.pago, emAberto: custos.flexiveis.emAberto },
        proximoMes: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(`${mesPrevisao}-01T12:00:00-03:00`)),
        previsaoOperacional: soma(previsaoOperacional.map(d => d.saldo)),
        contasPrevistas: previsaoOperacional.filter(d => d.saldo > 0).length,
      }}
    />
  );
}
