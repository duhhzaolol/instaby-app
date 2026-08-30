import { prisma } from "@/lib/prisma";
import FinanceiroClient from "@/components/dashboard/FinanceiroClient";
import { faixaPeriodo } from "@/lib/periodoFinanceiro";

const NOMES_MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

async function garantirRecorrentesDoMes() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const modelos = await prisma.despesa.findMany({ where: { recorrente: true } });

  for (const modelo of modelos) {
    const jaExisteEsseMes = await prisma.despesa.findFirst({
      where: {
        data: { gte: inicioMes },
        OR: [{ id: modelo.id }, { origemRecorrenteId: modelo.id }],
      },
    });

    if (!jaExisteEsseMes) {
      await prisma.despesa.create({
        data: {
          descricao: modelo.descricao,
          valor: modelo.valor,
          tipo: modelo.tipo,
          categoriaFinanceira: modelo.categoriaFinanceira,
          categoria: modelo.categoria,
          subcategoria: modelo.subcategoria,
          clienteId: modelo.clienteId,
          recorrente: false,
          origemRecorrenteId: modelo.id,
          data: inicioMes,
        },
      });
    }
  }
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { periodo?: string; desde?: string; ate?: string };
}) {
  await garantirRecorrentesDoMes();

  const periodo = searchParams.periodo || "mes_atual";
  const { desde, ate, meses } = faixaPeriodo(periodo, { desde: searchParams.desde, ate: searchParams.ate });

  const hoje = new Date();
  const mesesGrafico = Math.max(meses, 6);
  const desdeGrafico = new Date(hoje.getFullYear(), hoje.getMonth() - (mesesGrafico - 1), 1);
  const desdeConsulta = desde < desdeGrafico ? desde : desdeGrafico;

  const [cobrancasTodas, despesasTodas, cobrancasPendentes, clientes] = await Promise.all([
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: desdeConsulta } },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: desdeConsulta }, status: { not: "cancelado" } },
      include: { cliente: true },
      orderBy: { data: "desc" },
    }),
    prisma.cobranca.findMany({
      where: { status: { in: ["pendente", "atrasado"] } },
      include: { cliente: true },
      orderBy: { vencimento: "asc" },
    }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

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
  const totalFixas = custosFixos
    .filter((d) => d.categoriaFinanceira !== "transferencia")
    .reduce((s, d) => s + Number(d.valor), 0);
  const totalFlexiveis = custosFlexiveis
    .filter((d) => d.categoriaFinanceira !== "transferencia")
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
      }))}
      clientes={clientes}
    />
  );
}
