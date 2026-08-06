import { prisma } from "@/lib/prisma";
import FinanceiroClient from "@/components/dashboard/FinanceiroClient";

function mesesAtras(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function FinanceiroPage() {
  const desde = mesesAtras(5);

  const [cobrancas, despesas, cobrancasPendentes, clientes] = await Promise.all([
    prisma.cobranca.findMany({
      where: { createdAt: { gte: desde } },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: desde } },
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

  const nomesMeses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mensal: Record<string, { entradas: number; saidas: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    mensal[nomesMeses[d.getMonth()]] = { entradas: 0, saidas: 0 };
  }
  cobrancas
    .filter((c) => c.status === "pago")
    .forEach((c) => {
      const chave = nomesMeses[c.createdAt.getMonth()];
      if (chave in mensal) mensal[chave].entradas += Number(c.valor);
    });
  despesas.forEach((d) => {
    const chave = nomesMeses[d.data.getMonth()];
    if (chave in mensal) mensal[chave].saidas += Number(d.valor);
  });

  const totalEntradas = cobrancas.filter((c) => c.status === "pago").reduce((s, c) => s + Number(c.valor), 0);
  const totalSaidas = despesas.reduce((s, d) => s + Number(d.valor), 0);

  return (
    <FinanceiroClient
      resumo={{
        entradas: totalEntradas,
        saidas: totalSaidas,
        lucro: totalEntradas - totalSaidas,
      }}
      grafico={Object.entries(mensal).map(([mes, v]) => ({
        mes,
        entradas: v.entradas,
        saidas: v.saidas,
        lucro: v.entradas - v.saidas,
      }))}
      cobrancasPendentes={cobrancasPendentes.map((c) => ({
        id: c.id,
        cliente: c.cliente.nome,
        valor: Number(c.valor),
        status: c.status,
        vencimento: c.vencimento?.toISOString() || null,
      }))}
      despesasRecentes={despesas.slice(0, 8).map((d) => ({
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
