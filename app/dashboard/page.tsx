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
    leadsPendentes,
    cobrancasPagasMes,
    cobrancasPendentes,
    tarefasAbertas,
    tarefas,
    clientes,
    clientesComContagem,
    tarefasHoje,
    config,
    cobrancasPagasPorCliente,
    cobrancasRecentes,
    clientesRecentes,
    contratosRecentes,
    orcamentosRecentes,
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
  ]);

  const metaFaturamento = config?.metaFaturamentoMensal ? Number(config.metaFaturamentoMensal) : 0;
  const faturamentoMes = Number(cobrancasPagasMes._sum.valor || 0);

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
      meta={{ valor: metaFaturamento, atual: faturamentoMes }}
      performancePorCliente={performancePorCliente}
      atividades={atividades.map((a) => ({ ...a, data: a.data.toISOString() }))}
    />
  );
}
