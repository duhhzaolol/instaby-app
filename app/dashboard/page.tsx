import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
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

export default async function DashboardPage() {
  const [
    clientesAtivos,
    clientesPorStatus,
    cobrancasPagasMes,
    cobrancasRecorrentes,
    cobrancasPendentes,
    despesasMes,
    orcamentosPendentes,
    tarefasAbertas,
    cobrancasSeisMeses,
    cobrancasVencendoHoje,
    tarefasHoje,
    orcamentosEnviadosHoje,
    clientesRecentes,
    tarefasRecentes,
    orcamentosRecentes,
    cobrancasRecentes,
  ] = await Promise.all([
    prisma.cliente.count({ where: { status: "ativo" } }),
    prisma.cliente.groupBy({ by: ["status"], _count: true }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: { status: "pago", createdAt: { gte: inicioMes() } },
    }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      where: { tipo: "recorrente" },
    }),
    prisma.cobranca.aggregate({
      _sum: { valor: true },
      _count: true,
      where: { status: { in: ["pendente", "atrasado"] } },
    }),
    prisma.despesa.aggregate({
      _sum: { valor: true },
      where: { data: { gte: inicioMes() } },
    }),
    prisma.orcamento.count({ where: { status: "pendente" } }),
    prisma.tarefa.count({ where: { status: { in: ["a_fazer", "em_andamento"] } } }),
    prisma.cobranca.findMany({
      where: {
        status: "pago",
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) },
      },
      select: { valor: true, createdAt: true },
    }),
    prisma.cobranca.count({ where: { vencimento: { gte: inicioHoje(), lt: fimHoje() } } }),
    prisma.tarefa.count({ where: { createdAt: { gte: inicioHoje(), lt: fimHoje() } } }),
    prisma.orcamento.count({ where: { enviadoEm: { gte: inicioHoje(), lt: fimHoje() } } }),
    prisma.cliente.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { nome: true, createdAt: true } }),
    prisma.tarefa.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { titulo: true, createdAt: true } }),
    prisma.orcamento.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { status: true, createdAt: true, cliente: { select: { nome: true } } },
    }),
    prisma.cobranca.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { valor: true, status: true, createdAt: true, cliente: { select: { nome: true } } },
    }),
  ]);

  const mapaStatus: Record<string, number> = {};
  clientesPorStatus.forEach((g) => (mapaStatus[g.status] = g._count));

  const graficoReceita: Record<string, number> = {};
  const nomesMeses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    graficoReceita[nomesMeses[d.getMonth()]] = 0;
  }
  cobrancasSeisMeses.forEach((c) => {
    const chave = nomesMeses[c.createdAt.getMonth()];
    if (chave in graficoReceita) graficoReceita[chave] += Number(c.valor);
  });

  const timeline = [
    ...clientesRecentes.map((c) => ({
      tipo: "cliente" as const,
      texto: `Novo cliente cadastrado: ${c.nome}`,
      data: c.createdAt,
    })),
    ...tarefasRecentes.map((t) => ({
      tipo: "tarefa" as const,
      texto: `Tarefa criada: ${t.titulo}`,
      data: t.createdAt,
    })),
    ...orcamentosRecentes.map((o) => ({
      tipo: "orcamento" as const,
      texto:
        o.status === "aceito"
          ? `Orçamento aceito por ${o.cliente.nome}`
          : `Orçamento enviado pra ${o.cliente.nome}`,
      data: o.createdAt,
    })),
    ...cobrancasRecentes.map((c) => ({
      tipo: "cobranca" as const,
      texto:
        c.status === "pago"
          ? `Pagamento recebido de ${c.cliente.nome}`
          : `Cobrança criada pra ${c.cliente.nome}`,
      data: c.createdAt,
    })),
  ]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 6);

  return (
    <DashboardClient
      metrics={{
        faturamentoMes: Number(cobrancasPagasMes._sum.valor || 0),
        clientesAtivos,
        receitaRecorrente: Number(cobrancasRecorrentes._sum.valor || 0),
        cobrancasPendentesValor: Number(cobrancasPendentes._sum.valor || 0),
        cobrancasPendentesQtd: cobrancasPendentes._count,
        despesasMes: Number(despesasMes._sum.valor || 0),
        orcamentosPendentes,
        tarefasAbertas,
      }}
      clientesPorStatus={[
        { name: "Ativo", value: mapaStatus["ativo"] || 0 },
        { name: "Lead", value: mapaStatus["lead"] || 0 },
        { name: "Inativo", value: mapaStatus["inativo"] || 0 },
      ]}
      receitaMensal={Object.entries(graficoReceita).map(([mes, valor]) => ({ mes, valor }))}
      hoje={{
        cobrancasVencendo: cobrancasVencendoHoje,
        tarefasCriadas: tarefasHoje,
        orcamentosEnviados: orcamentosEnviadosHoje,
      }}
      timeline={timeline.map((t) => ({ ...t, data: t.data.toISOString() }))}
    />
  );
}
