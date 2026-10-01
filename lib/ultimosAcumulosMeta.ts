import { prisma } from "@/lib/prisma";
import type { UltimoAcumulo } from "@/lib/trafego";

type Alvo = { campanhaId: string; ano: number; mes: number };
export const chaveAcumuloMeta = (alvo: Alvo) => `${alvo.campanhaId}|${alvo.ano}|${alvo.mes}`;

// Busca o histórico de todas as campanhas de uma vez. A regra de escolha continua
// sendo período mais recente, com desempate pela última correção gravada.
export async function ultimosAcumulosMeta(alvos: Alvo[], antesDe?: Date) {
  const unicos = Array.from(new Map(alvos.map((a) => [chaveAcumuloMeta(a), a])).values());
  const saida = new Map<string, UltimoAcumulo>();
  const escolhido = new Map<string, { fim: Date; criado: Date }>();
  const intervalo = (a: Alvo) => ({
    gte: new Date(Date.UTC(a.ano, a.mes, 1)),
    lt: new Date(Date.UTC(a.ano, a.mes + 1, 1)),
  });
  for (const a of unicos) saida.set(chaveAcumuloMeta(a), { valor: 0, periodoFim: null, origem: "nenhum" });
  const registrar = (chave: string, fim: Date, criado: Date, valor: number, origem: "novo" | "legado") => {
    const atual = escolhido.get(chave);
    if (!atual || fim > atual.fim || (fim.getTime() === atual.fim.getTime() && criado > atual.criado)) {
      escolhido.set(chave, { fim, criado });
      saida.set(chave, { valor, periodoFim: fim, origem });
    }
  };

  for (let i = 0; i < unicos.length; i += 500) {
    const grupo = unicos.slice(i, i + 500);
    const itens = await prisma.itemImportacao.findMany({
      where: { OR: grupo.map((a) => ({
        campanhaId: a.campanhaId,
        lote: { periodoInicio: intervalo(a), ...(antesDe ? { periodoFim: { lt: antesDe } } : {}) },
      })) },
      select: {
        campanhaId: true, gastoAcumuladoArquivo: true, createdAt: true,
        lote: { select: { periodoInicio: true, periodoFim: true } },
      },
    });
    for (const item of itens) {
      if (!item.campanhaId) continue;
      const chave = chaveAcumuloMeta({ campanhaId: item.campanhaId, ano: item.lote.periodoInicio.getUTCFullYear(), mes: item.lote.periodoInicio.getUTCMonth() });
      registrar(chave, item.lote.periodoFim, item.createdAt, Number(item.gastoAcumuladoArquivo), "novo");
    }

    const semHistorico = grupo.filter((a) => saida.get(chaveAcumuloMeta(a))!.origem === "nenhum");
    if (!semHistorico.length) continue;
    const legados = await prisma.resultadoCampanha.findMany({
      where: {
        origem: "meta_import",
        ...(antesDe ? { fim: { lt: antesDe } } : {}),
        OR: semHistorico.map((a) => ({ campanhaId: a.campanhaId, inicio: intervalo(a) })),
      },
      select: { campanhaId: true, inicio: true, fim: true, verbaInvestida: true, createdAt: true },
    });
    for (const item of legados) {
      const chave = chaveAcumuloMeta({ campanhaId: item.campanhaId, ano: item.inicio.getUTCFullYear(), mes: item.inicio.getUTCMonth() });
      registrar(chave, item.fim, item.createdAt, Number(item.verbaInvestida ?? 0), "legado");
    }
  }
  return saida;
}
