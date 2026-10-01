import { prisma } from "@/lib/prisma";
import {
  calcularRetornoTrafego,
  type VendaTrafego,
} from "@/lib/retornoTrafego";
export async function retornoDoPeriodo(
  clienteId: string,
  inicio: Date,
  fim: Date,
) {
  if (
    inicio.getUTCDate() !== 1 ||
    inicio.getUTCFullYear() !== fim.getUTCFullYear() ||
    inicio.getUTCMonth() !== fim.getUTCMonth()
  )
    return null;
  const mes = inicio.toISOString().slice(0, 7);
  const retorno = await prisma.retornoMensalTrafego.findUnique({
    where: { clienteId_mes: { clienteId, mes } },
  });
  if (
    !retorno ||
    retorno.apuradoAte > fim ||
    !(retorno.itens as VendaTrafego[]).length
  )
    return null;
  const lote = await prisma.loteImportacao.findFirst({
    where: { clienteId, periodoInicio: inicio, periodoFim: { lte: fim } },
    orderBy: [{ periodoFim: "desc" }, { createdAt: "desc" }],
  });
  const investimentoConsiderado = lote ? Number(lote.gastoTotalArquivo) : null;
  const datasIguais =
    !!lote && lote.periodoFim.getTime() === retorno.apuradoAte.getTime();
  return {
    mes,
    apuradoAte: retorno.apuradoAte.toISOString().slice(0, 10),
    itens: retorno.itens as VendaTrafego[],
    observacoes: retorno.observacoes,
    investimentoConsiderado,
    dataInvestimento: lote?.periodoFim.toISOString().slice(0, 10) || null,
    datasIguais,
    resumo: calcularRetornoTrafego(
      retorno.itens as VendaTrafego[],
      investimentoConsiderado || 0,
    ),
  };
}
