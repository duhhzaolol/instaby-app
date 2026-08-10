import { prisma } from "@/lib/prisma";
import FinanceiroClient from "@/components/dashboard/FinanceiroClient";

const NOMES_MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function faixaPeriodo(periodo: string) {
  const hoje = new Date();
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  if (periodo === "mes_anterior") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
    return { desde: inicio, ate: fim, meses: 1 };
  }
  if (periodo === "3m") return { desde: new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1), ate: hoje, meses: 3 };
  if (periodo === "6m") return { desde: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1), ate: hoje, meses: 6 };
  return { desde: inicioMesAtual, ate: hoje, meses: 1 };
}

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
          clienteId: modelo.clienteId,
          recorrente: false,
          origemRecorrenteId: modelo.id,
          data: inicioMes,
        },
      });
    }
  }
}

export default async function FinanceiroPage({ searchParams }: { searchParams: { periodo?: string } }) {
  await garantirRecorrentesDoMes();

  const periodo = searchParams.periodo || "mes_atual";
  const { desde, ate, meses } = faixaPeriodo(periodo);

  const [cobrancas, despesas, cobrancasPendentes, clientes] = await Promise.all([
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: desde, lte: ate } },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: desde, lte: ate } },
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

  const mensal: Record<string, { entradas: number; despesasFixas: number; despesasFlexiveis: number }> = {};
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    mensal[NOMES_MESES[d.getMonth()]] = { entradas: 0, despesasFixas: 0, despesasFlexiveis: 0 };
  }
  cobrancas.forEach((c) => {
    const chave = NOMES_MESES[c.createdAt.getMonth()];
    if (chave in mensal) mensal[chave].entradas += Number(c.valor);
  });
  despesas.forEach((d) => {
    const chave = NOMES_MESES[d.data.getMonth()];
    if (chave in mensal) {
      if (d.tipo === "fixa") mensal[chave].despesasFixas += Number(d.valor);
      else mensal[chave].despesasFlexiveis += Number(d.valor);
    }
  });

  const totalEntradas = cobrancas.reduce((s, c) => s + Number(c.valor), 0);
  const custosFixos = despesas.filter((d) => d.tipo === "fixa");
  const custosFlexiveis = despesas.filter((d) => d.tipo !== "fixa");
  const totalFixas = custosFixos.reduce((s, d) => s + Number(d.valor), 0);
  const totalFlexiveis = custosFlexiveis.reduce((s, d) => s + Number(d.valor), 0);

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
      }))}
      custosFlexiveis={custosFlexiveis.slice(0, 10).map((d) => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor),
        cliente: d.cliente?.nome || null,
        data: d.data.toISOString(),
      }))}
      clientes={clientes}
    />
  );
}
