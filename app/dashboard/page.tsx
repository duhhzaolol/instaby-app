import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioMesAnterior() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function inicioMesesAtras(n: number) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - n, 1);
}

function inicioHoje() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fimHoje() {
  const d = inicioHoje();
  d.setDate(d.getDate() + 1);
  return d;
}

function fimAmanha() {
  const d = inicioHoje();
  d.setDate(d.getDate() + 2);
  return d;
}

export default async function DashboardPage() {
  const [
    clientesAtivos,
    leadsPendentes,
    cobrancasPagasMes,
    cobrancasPendentes,
    tarefasAbertas,
    tarefas,
    clientes,
    clientesComContagem,
    tarefasHoje,
    tarefasAmanha,
    config,
    cobrancasPagasPorCliente,
    cobrancasRecentes,
    clientesRecentes,
    contratosRecentes,
    orcamentosRecentes,
    faturamentoMesAnteriorAgg,
    tarefasAtrasadas,
    cobrancasVencidas,
    contratosAssinados,
    despesasSemClassificacao,
    itensOnboardingBloqueados,
    oportunidadesAbertas,
    cobrancasPagasUltimosMeses,
  ] = await Promise.all([
    prisma.cliente.count({ where: { status: "ativo" } }),
    prisma.cliente.count({ where: { status: "lead" } }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: { status: "pago", createdAt: { gte: inicioMes() } },
    }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      _count: true,
      where: { status: { in: ["pendente", "atrasado"] } },
    }),
    prisma.tarefa.count({ where: { status: { in: ["a_fazer", "em_andamento"] } } }),
    prisma.tarefa.findMany({
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    prisma.cliente.findMany({
      where: { status: "ativo" },
      select: {
        id: true,
        nome: true,
        cor: true,
        _count: { select: { tarefas: true } },
        tarefas: { where: { status: { not: "feito" } }, select: { id: true } },
      },
      orderBy: { nome: "asc" },
      take: 6,
    }),
    prisma.tarefa.findMany({
      where: { prazo: { gte: inicioHoje(), lt: fimHoje() } },
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { prazo: "asc" },
    }),
    prisma.tarefa.findMany({
      where: { prazo: { gte: fimHoje(), lt: fimAmanha() }, status: { not: "feito" } },
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { prazo: "asc" },
    }),
    prisma.configuracao.findUnique({ where: { id: "config" } }),
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: inicioMes() } },
      include: { cliente: { select: { nome: true, cor: true } } },
    }),
    prisma.cobranca.findMany({
      where: { status: "pago" },
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.cliente.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.contrato.findMany({
      include: { cliente: { select: { nome: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.orcamento.findMany({
      where: { status: "aceito" },
      include: { cliente: { select: { nome: true } }, itens: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: { status: "pago", createdAt: { gte: inicioMesAnterior(), lt: inicioMes() } },
    }),
    prisma.tarefa.count({ where: { status: { not: "feito" }, prazo: { lt: new Date() } } }),
    prisma.cobranca.count({ where: { status: { in: ["pendente", "atrasado"] }, vencimento: { lt: new Date() } } }),
    prisma.contrato.findMany({
      where: { status: "assinado" },
      include: { cliente: { select: { nome: true, prazoContratoMeses: true } } },
    }),
    prisma.despesa.count({ where: { categoriaFinanceira: null, status: { not: "cancelado" } } }),
    prisma.itemOnboarding.count({ where: { status: "bloqueado", onboarding: { status: "em_andamento" } } }),
    prisma.oportunidade.findMany({ where: { status: { notIn: ["ganho", "perdido"] } } }),
    // Pra montar o gráfico de faturamento do Dashboard — agrupado por mês em JS logo
    // abaixo, porque "group by mês" não tem um jeito direto no Prisma sem SQL cru.
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: inicioMesesAtras(5) } },
      select: { valor: true, createdAt: true },
    }),
  ]);

  const metaFaturamento = config?.metaFaturamentoMensal ? Number(config.metaFaturamentoMensal) : 0;
  const faturamentoMes = Number(cobrancasPagasMes._sum.valor || 0);
  const faturamentoMesAnterior = Number(faturamentoMesAnteriorAgg._sum.valor || 0);

  const contratosRenovando = contratosAssinados.filter((c) => {
    if (!c.cliente.prazoContratoMeses) return false;
    const renovacao = new Date(c.createdAt);
    renovacao.setMonth(renovacao.getMonth() + c.cliente.prazoContratoMeses);
    const dias = Math.round((renovacao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias <= 30;
  }).length;

  const oportunidadesSemProximaAcao = oportunidadesAbertas.filter((o) => !o.proximaAcao || !o.dataProximaAcao).length;

  const alertas = [
    { label: "Tarefas atrasadas", contagem: tarefasAtrasadas, href: "/dashboard/tarefas", cor: "#EF4444" },
    { label: "Cobranças vencidas", contagem: cobrancasVencidas, href: "/dashboard/financeiro/contas-a-receber", cor: "#EF4444" },
    { label: "Contrato(s) renovando em breve", contagem: contratosRenovando, href: "/dashboard/contratos", cor: "#F59E0B" },
    { label: "Despesas sem classificação", contagem: despesasSemClassificacao, href: "/dashboard/financeiro/contas-a-pagar?aba=todas&categoria=sem_classificacao", cor: "#F59E0B" },
    { label: "Item(ns) de onboarding bloqueados", contagem: itensOnboardingBloqueados, href: "/dashboard/clientes", cor: "#F59E0B" },
    { label: "Oportunidade(s) sem próxima ação", contagem: oportunidadesSemProximaAcao, href: "/dashboard/oportunidades", cor: "#9CA3AF" },
  ].filter((a) => a.contagem > 0);
  const variacaoFaturamento =
    faturamentoMesAnterior > 0 ? Math.round(((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100) : null;

  const somaPorCliente: Record<string, { nome: string; cor: string | null; valor: number }> = {};
  cobrancasPagasPorCliente.forEach((c) => {
    const chave = c.cliente.nome;
    somaPorCliente[chave] ||= { nome: c.cliente.nome, cor: c.cliente.cor, valor: 0 };
    somaPorCliente[chave].valor += Number(c.valor);
  });
  const totalPorClientes = Object.values(somaPorCliente).reduce((s, c) => s + c.valor, 0);
  const performancePorCliente = Object.values(somaPorCliente)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)
    .map((c) => ({ ...c, percentual: totalPorClientes > 0 ? Math.round((c.valor / totalPorClientes) * 100) : 0 }));

  // Últimos 6 meses (incluindo o atual), sempre na ordem cronológica, mesmo os meses
  // sem nenhuma cobrança paga ainda (entram com R$ 0 — não somem do eixo).
  const baldes: { chave: string; mes: string; valor: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = inicioMesesAtras(i);
    baldes.push({
      chave: `${d.getFullYear()}-${d.getMonth()}`,
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      valor: 0,
    });
  }
  cobrancasPagasUltimosMeses.forEach((c) => {
    const chave = `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}`;
    const balde = baldes.find((b) => b.chave === chave);
    if (balde) balde.valor += Number(c.valor);
  });
  const faturamentoPorMes = baldes.map((b) => ({ mes: b.mes, valor: b.valor }));

  type Atividade = { id: string; texto: string; cliente: string; valor?: number; data: Date; tipo: string };
  const atividades: Atividade[] = [
    ...cobrancasRecentes.map((c) => ({
      id: `cobranca-${c.id}`,
      texto: "Pagamento recebido",
      cliente: c.cliente.nome,
      valor: Number(c.valor),
      data: c.createdAt,
      tipo: "pagamento",
    })),
    ...clientesRecentes.map((c) => ({
      id: `cliente-${c.id}`,
      texto: "Novo cliente adicionado",
      cliente: c.nome,
      data: c.createdAt,
      tipo: "cliente",
    })),
    ...contratosRecentes.map((c) => ({
      id: `contrato-${c.id}`,
      texto: c.status === "assinado" ? "Contrato assinado" : "Contrato gerado",
      cliente: c.cliente.nome,
      data: c.createdAt,
      tipo: "contrato",
    })),
    ...orcamentosRecentes.map((o) => ({
      id: `orcamento-${o.id}`,
      texto: "Proposta aceita",
      cliente: o.cliente.nome,
      valor: o.itens.reduce((s, i) => s + Number(i.valor), 0),
      data: o.createdAt,
      tipo: "orcamento",
    })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 6);

  return (
    <DashboardClient
      metrics={{
        clientesAtivos,
        leadsPendentes,
        faturamentoMes: Number(cobrancasPagasMes._sum.valor || 0),
        cobrancasPendentesValor: Number(cobrancasPendentes._sum.valor || 0),
        cobrancasPendentesQtd: cobrancasPendentes._count,
        tarefasAbertas,
      }}
      tarefas={tarefas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        tipo: t.tipo,
        status: t.status,
        prazo: t.prazo?.toISOString() || null,
        categoria: t.categoria,
        descricao: t.descricao,
        prioridade: t.prioridade,
        clienteId: t.clienteId,
        clienteNome: t.cliente?.nome || null,
        clienteCor: t.cliente?.cor || null,
      }))}
      clientes={clientes}
      clientesResumo={clientesComContagem.map((c) => ({
        id: c.id,
        nome: c.nome,
        cor: c.cor,
        totalTarefas: c._count.tarefas,
        pendentes: c.tarefas.length,
      }))}
      tarefasHoje={tarefasHoje.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        prazo: t.prazo!.toISOString(),
        clienteNome: t.cliente?.nome || null,
        clienteCor: t.cliente?.cor || null,
      }))}
      tarefasAmanha={tarefasAmanha.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        prazo: t.prazo!.toISOString(),
        clienteNome: t.cliente?.nome || null,
        clienteCor: t.cliente?.cor || null,
      }))}
      meta={{ valor: metaFaturamento, atual: faturamentoMes }}
      alertas={alertas}
      performancePorCliente={performancePorCliente}
      variacaoFaturamento={variacaoFaturamento}
      atividades={atividades.map((a) => ({ ...a, data: a.data.toISOString() }))}
      faturamentoPorMes={faturamentoPorMes}
    />
  );
}
