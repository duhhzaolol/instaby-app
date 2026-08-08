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
  ]);

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
    />
  );
}
