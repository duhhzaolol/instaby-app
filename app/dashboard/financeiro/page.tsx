import { prisma } from "@/lib/prisma";
import FinanceiroClient from "@/components/dashboard/FinanceiroClient";
import { faixaPeriodo } from "@/lib/periodoFinanceiro";

const NOMES_MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { periodo?: string; desde?: string; ate?: string };
}) {
  // Nota: a geração de despesas/cobranças recorrentes do mês roda no layout do
  // dashboard (app/dashboard/layout.tsx), então já está garantida antes daqui.

  const periodo = searchParams.periodo || "mes_atual";
  const { desde, ate, meses } = faixaPeriodo(periodo, { desde: searchParams.desde, ate: searchParams.ate });

  const hoje = new Date();
  const mesesGrafico = Math.max(meses, 6);
  const desdeGrafico = new Date(hoje.getFullYear(), hoje.getMonth() - (mesesGrafico - 1), 1);
  const desdeConsulta = desde < desdeGrafico ? desde : desdeGrafico;

  const inicioMesAtualCalc = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMesAtualCalc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const [
    cobrancasTodas,
    despesasTodas,
    cobrancasPendentes,
    clientes,
    entradasTotalHistorico,
    saidasTotalHistorico,
    patrimonioAtivo,
  ] = await Promise.all([
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: desdeConsulta } },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: desdeConsulta }, status: { not: "cancelado" } },
      include: { cliente: true, pagamentos: true },
      orderBy: { data: "desc" },
    }),
    prisma.cobranca.findMany({
      where: { status: { in: ["pendente", "atrasado"] } },
      include: { cliente: true },
      orderBy: { vencimento: "asc" },
    }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    // Saldo atual (caixa): tudo que já entrou de verdade, desde sempre
    prisma.cobranca.aggregate({ where: { status: "pago" }, _sum: { valor: true } }),
    // Saldo atual (caixa): tudo que já saiu de verdade, desde sempre (inclui investimentos —
    // eles reduzem caixa igual qualquer outra saída, só não entram na DRE)
    prisma.despesa.aggregate({ where: { status: "pago" }, _sum: { valor: true } }),
    // Patrimônio em uso — soma do valor atual estimado
    prisma.patrimonio.aggregate({ where: { status: "em_uso" }, _sum: { valorAtual: true } }),
  ]);

  // Cobranças do mês atual por competência (mesma regra da DRE) — pra "Resultado do mês" bater com a DRE
  const cobrancasMesAtualDRE = await prisma.cobranca.findMany({
    where: {
      status: { not: "cancelado" },
      OR: [
        { dataCompetencia: { gte: inicioMesAtualCalc, lte: fimMesAtualCalc } },
        { AND: [{ dataCompetencia: null }, { createdAt: { gte: inicioMesAtualCalc, lte: fimMesAtualCalc } }] },
      ],
    },
  });
  const despesasMesAtualCompetencia = despesasTodas.filter(
    (d) => d.data >= inicioMesAtualCalc && d.data <= fimMesAtualCalc
  );
  const receitaBrutaMes = cobrancasMesAtualDRE.reduce((s, c) => s + Number(c.valor), 0);
  const somaPorMes = (cat: string) =>
    despesasMesAtualCompetencia
      .filter((d) => d.categoriaFinanceira === cat)
      .reduce((s, d) => s + Number(d.valor), 0);
  const resultadoDoMes =
    receitaBrutaMes -
    somaPorMes("imposto") -
    somaPorMes("custo") -
    somaPorMes("despesa_fixa") -
    somaPorMes("despesa_variavel") -
    somaPorMes("despesa_financeira");

  // Variação de caixa do mês — entradas e saídas efetivamente pagas/recebidas (inclui investimentos)
  const entradasCaixaMes = cobrancasTodas
    .filter((c) => c.createdAt >= inicioMesAtualCalc && c.createdAt <= fimMesAtualCalc)
    .reduce((s, c) => s + Number(c.valor), 0);
  const saidasCaixaMes = despesasTodas
    .filter((d) => d.status === "pago" && d.data >= inicioMesAtualCalc && d.data <= fimMesAtualCalc)
    .reduce((s, d) => s + Number(d.valor), 0);
  const variacaoCaixaMes = entradasCaixaMes - saidasCaixaMes;

  const saldoAtual = Number(entradasTotalHistorico._sum.valor || 0) - Number(saidasTotalHistorico._sum.valor || 0);
  const patrimonioTotal = Number(patrimonioAtivo._sum.valorAtual || 0);

  // Gráfico: sempre com pelo menos 6 meses de histórico, pra linha nunca ficar com 1 ponto só
  const mensal: Record<string, { entradas: number; despesasFixas: number; despesasFlexiveis: number }> = {};
  for (let i = mesesGrafico - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    mensal[NOMES_MESES[d.getMonth()]] = { entradas: 0, despesasFixas: 0, despesasFlexiveis: 0 };
  }
  cobrancasTodas.forEach((c) => {
    const chave = NOMES_MESES[c.createdAt.getMonth()];
    if (chave in mensal) mensal[chave].entradas += Number(c.valor);
  });
  despesasTodas.forEach((d) => {
    if (d.categoriaFinanceira === "transferencia") return; // retirada/transferência não conta como despesa
    const chave = NOMES_MESES[d.data.getMonth()];
    if (chave in mensal) {
      if (d.tipo === "fixa") mensal[chave].despesasFixas += Number(d.valor);
      else mensal[chave].despesasFlexiveis += Number(d.valor);
    }
  });

  // Resumo e listas: só o período que a pessoa escolheu no seletor
  const cobrancas = cobrancasTodas.filter((c) => c.createdAt >= desde && c.createdAt <= ate);
  const despesas = despesasTodas.filter((d) => d.data >= desde && d.data <= ate);

  const totalEntradas = cobrancas.reduce((s, c) => s + Number(c.valor), 0);
  const custosFixos = despesas.filter((d) => d.tipo === "fixa");
  const custosFlexiveis = despesas.filter((d) => d.tipo !== "fixa");
  // "Entradas" só conta cobrança já recebida (status pago) — então, pra "Lucro"
  // fazer sentido junto dela (e bater com "Variação de caixa"), os custos aqui
  // também só podem contar despesa já paga. Antes essa soma incluía despesa
  // pendente/atrasada junto com receita só do que já entrou, misturando duas
  // bases diferentes — por isso o "Lucro" não batia com o saldo real em caixa.
  // As listas de despesas abaixo continuam mostrando tudo (pago e pendente).
  const totalFixas = custosFixos
    .filter((d) => d.categoriaFinanceira !== "transferencia" && d.status === "pago")
    .reduce((s, d) => s + Number(d.valor), 0);
  const totalFlexiveis = custosFlexiveis
    .filter((d) => d.categoriaFinanceira !== "transferencia" && d.status === "pago")
    .reduce((s, d) => s + Number(d.valor), 0);

  // Acúmulo dia a dia do mês selecionado (só faz sentido pra "este mês" / "mês anterior")
  let graficoDiario: { dia: number; entradas: number; lucro: number }[] | null = null;
  if (periodo === "mes_atual" || periodo === "mes_anterior") {
    const ultimoDia =
      periodo === "mes_atual" ? hoje.getDate() : new Date(ate.getFullYear(), ate.getMonth() + 1, 0).getDate();

    const entradasPorDia: Record<number, number> = {};
    const custosPorDia: Record<number, number> = {};
    cobrancas.forEach((c) => {
      const dia = c.createdAt.getDate();
      entradasPorDia[dia] = (entradasPorDia[dia] || 0) + Number(c.valor);
    });
    despesas.forEach((d) => {
      if (d.categoriaFinanceira === "transferencia") return;
      const dia = d.data.getDate();
      custosPorDia[dia] = (custosPorDia[dia] || 0) + Number(d.valor);
    });

    let acumuladoEntradas = 0;
    let acumuladoCustos = 0;
    graficoDiario = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
      acumuladoEntradas += entradasPorDia[dia] || 0;
      acumuladoCustos += custosPorDia[dia] || 0;
      graficoDiario.push({ dia, entradas: acumuladoEntradas, lucro: acumuladoEntradas - acumuladoCustos });
    }
  }

  // Resumo por cliente — entradas, despesas e lucro, pra não precisar calcular na mão
  const porCliente: Record<string, { nome: string; cor: string | null; entradas: number; despesas: number }> = {};
  cobrancas.forEach((c) => {
    const chave = c.clienteId;
    porCliente[chave] ||= { nome: c.cliente.nome, cor: c.cliente.cor, entradas: 0, despesas: 0 };
    porCliente[chave].entradas += Number(c.valor);
  });
  despesas.forEach((d) => {
    if (!d.clienteId || !d.cliente) return;
    if (d.categoriaFinanceira === "transferencia") return;
    // Mesma correção do resumo geral: "entradas" aqui só conta cobrança paga
    // (a query já filtra status "pago"), então "despesas" também só pode contar
    // despesa paga — senão o "lucro" por cliente fica com a mesma mistura de
    // bases que o card geral tinha.
    if (d.status !== "pago") return;
    porCliente[d.clienteId] ||= { nome: d.cliente.nome, cor: d.cliente.cor, entradas: 0, despesas: 0 };
    porCliente[d.clienteId].despesas += Number(d.valor);
  });
  const resumoPorCliente = Object.values(porCliente)
    .map((c) => ({ ...c, lucro: c.entradas - c.despesas }))
    .sort((a, b) => b.entradas - a.entradas);

  // Calendário financeiro do mês atual — recebimentos e pagamentos já lançados no sistema
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const movimentosMes: {
    dia: number;
    tipo: "entrada" | "saida";
    valor: number;
    descricao: string;
    cliente: string | null;
  }[] = [];
  cobrancasTodas.forEach((c) => {
    if (c.createdAt >= inicioMesAtual && c.createdAt <= fimMesAtual) {
      movimentosMes.push({
        dia: c.createdAt.getDate(),
        tipo: "entrada",
        valor: Number(c.valor),
        descricao: c.categoria || "Cobrança",
        cliente: c.cliente.nome,
      });
    }
  });
  despesasTodas.forEach((d) => {
    if (d.categoriaFinanceira === "transferencia") return;
    if (d.data >= inicioMesAtual && d.data <= fimMesAtual) {
      movimentosMes.push({
        dia: d.data.getDate(),
        tipo: "saida",
        valor: Number(d.valor),
        descricao: d.descricao,
        cliente: d.cliente?.nome || null,
      });
    }
  });

  return (
    <FinanceiroClient
      periodo={periodo}
      resumo={{
        entradas: totalEntradas,
        despesasFixas: totalFixas,
        despesasFlexiveis: totalFlexiveis,
        lucro: totalEntradas - totalFixas - totalFlexiveis,
      }}
      grafico={Object.entries(mensal).map(([mes, v]) => ({ mes, ...v }))}
      graficoDiario={graficoDiario}
      cobrancasPendentes={cobrancasPendentes.map((c) => ({
        id: c.id,
        cliente: c.cliente.nome,
        clienteWhatsapp: c.cliente.whatsapp,
        valor: Number(c.valor),
        status: c.status,
        tipo: c.tipo,
        vencimento: c.vencimento?.toISOString() || null,
      }))}
      custosFixos={custosFixos.map((d) => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor),
        cliente: d.cliente?.nome || null,
        data: d.data.toISOString(),
        recorrente: d.recorrente || !!d.origemRecorrenteId,
        categoriaFinanceira: d.categoriaFinanceira,
        categoria: d.categoria,
        status: d.status,
        vencimento: d.vencimento?.toISOString() || null,
        totalPago: d.pagamentos.reduce((s, p) => s + Number(p.valor), 0),
      }))}
      custosFlexiveis={custosFlexiveis.map((d) => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor),
        cliente: d.cliente?.nome || null,
        data: d.data.toISOString(),
        categoriaFinanceira: d.categoriaFinanceira,
        categoria: d.categoria,
        status: d.status,
        vencimento: d.vencimento?.toISOString() || null,
        totalPago: d.pagamentos.reduce((s, p) => s + Number(p.valor), 0),
      }))}
      clientes={clientes}
      resumoPorCliente={resumoPorCliente}
      movimentosMes={movimentosMes}
      mesAtual={hoje.getMonth()}
      anoAtual={hoje.getFullYear()}
      caixa={{
        saldoAtual,
        resultadoDoMes,
        variacaoCaixaMes,
        patrimonioTotal,
      }}
    />
  );
}
