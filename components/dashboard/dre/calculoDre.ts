import { inicioDiaFinanceiro } from "@/lib/datasFinanceiro";
import { dataCompetenciaDaCobranca } from "@/lib/periodoFinanceiro";
import { categoriaFinanceiraDaDespesa } from "@/lib/classificacaoDespesa";
import {
  CobrancaFinanceira, DespesaFinanceira, movimentosDeCobranca,
  movimentosDeDespesa, movimentosFinanceiros, saldoEmPeriodo,
} from "@/lib/movimentosFinanceiros";

type CobrancaDre = CobrancaFinanceira & {
  createdAt: Date | string;
  dataCompetencia?: Date | string | null;
  vencimento?: Date | string | null;
};
type DespesaDre = DespesaFinanceira & { data: Date | string; categoria?: string | null };

export function somarDre(valores: number[]): number {
  return valores.reduce((total, valor) => total + Math.round(valor * 100), 0) / 100;
}

export function calcularDre({
  cobrancas, despesas, desde, ateCaixa, ateCompetencia, agora = new Date(),
}: {
  cobrancas: CobrancaDre[];
  despesas: DespesaDre[];
  desde: Date;
  ateCaixa: Date;
  ateCompetencia: Date;
  agora?: Date;
}) {
  const despesasClassificadas = despesas.map(d => ({ ...d, categoriaFinanceira: categoriaFinanceiraDaDespesa(d) }));
  const noPeriodo = (data: Date, ate: Date) => data >= desde && data <= ate;
  const cobrancasCompetencia = cobrancas.filter(c => c.status !== "cancelado" && noPeriodo(dataCompetenciaDaCobranca(c), ateCompetencia));
  const despesasCompetencia = despesasClassificadas.filter(d => d.status !== "cancelado" && noPeriodo(inicioDiaFinanceiro(d.data), ateCompetencia));
  const movimentos = movimentosFinanceiros(cobrancas, despesasClassificadas).filter(m => noPeriodo(m.data, ateCaixa) && m.data <= agora);
  const caixa = saldoEmPeriodo(movimentos, desde, ateCaixa);
  const pagamentosPorCategoria: Record<string, number[]> = {};
  for (const movimento of movimentos) {
    if (movimento.tipo !== "saida") continue;
    const categoria = movimento.categoriaFinanceira || "sem_classificacao";
    (pagamentosPorCategoria[categoria] ||= []).push(movimento.valor);
  }

  // Competência reconhece a obrigação inteira. A baixa real reduz somente o
  // saldo em aberto; não reduz a receita/despesa reconhecida naquela competência.
  const confirmadoAte = new Date(Math.min(ateCompetencia.getTime(), agora.getTime()));
  const restante = (valor: unknown, baixas: { valor: number; data: Date }[]) => {
    const pagos = somarDre(baixas.filter(p => p.data <= confirmadoAte).map(p => p.valor));
    return Math.max(0, Math.round(Number(valor) * 100) - Math.round(pagos * 100)) / 100;
  };
  const receitaEmAberto = somarDre(cobrancasCompetencia.map(c => restante(c.valor, movimentosDeCobranca(c))));
  const despesaEmAberto = somarDre(despesasCompetencia.map(d => restante(d.valor, movimentosDeDespesa(d))));
  const receitaBruta = somarDre(cobrancasCompetencia.map(c => Number(c.valor)));
  const somaCategoria = (categoria: string) => somarDre(despesasCompetencia.filter(d => d.categoriaFinanceira === categoria).map(d => Number(d.valor)));
  const impostos = somaCategoria("imposto");
  const custos = somaCategoria("custo");
  const despesasFixas = somaCategoria("despesa_fixa");
  const despesasVariaveis = somaCategoria("despesa_variavel");
  const despesasFinanceiras = somaCategoria("despesa_financeira");
  const investimentos = somaCategoria("investimento");
  const transferencias = somaCategoria("transferencia");
  const semClassificacao = somarDre(despesasCompetencia.filter(d => !d.categoriaFinanceira).map(d => Number(d.valor)));
  const receitaLiquida = somarDre([receitaBruta, -impostos]);
  const lucroBruto = somarDre([receitaLiquida, -custos]);
  const despesasOperacionais = somarDre([despesasFixas, despesasVariaveis]);
  const lucroOperacional = somarDre([lucroBruto, -despesasOperacionais]);
  const lucroLiquido = somarDre([lucroOperacional, -despesasFinanceiras]);
  const categoriasOperacionais: Record<string, number[]> = {};
  for (const despesa of despesasCompetencia) {
    if (despesa.categoriaFinanceira !== "despesa_fixa" && despesa.categoriaFinanceira !== "despesa_variavel") continue;
    const categoria = despesa.categoria || (despesa.categoriaFinanceira === "despesa_fixa" ? "Outras despesas fixas" : "Outras despesas variáveis");
    (categoriasOperacionais[categoria] ||= []).push(Number(despesa.valor));
  }

  return {
    caixa: {
      recebido: caixa.totalEntradas, pago: caixa.totalSaidas,
      variacao: (Math.round(caixa.totalEntradas * 100) - Math.round(caixa.totalSaidas * 100)) / 100,
      quantidadeMovimentos: movimentos.length,
      pagamentosPorCategoria: Object.entries(pagamentosPorCategoria).map(([categoria, valores]) => ({ categoria, valor: somarDre(valores) })).sort((a, b) => b.valor - a.valor),
    },
    competencia: {
      receitaBruta, impostos, receitaLiquida, custos, lucroBruto,
      despesasFixas, despesasVariaveis, despesasOperacionais, lucroOperacional,
      despesasFinanceiras, lucroLiquido, investimentos, transferencias, semClassificacao,
      receitaEmAberto, despesaEmAberto, confirmadoAte,
      categoriasOperacionais: Object.entries(categoriasOperacionais).map(([categoria, valores]) => ({ categoria, valor: somarDre(valores) })).sort((a, b) => b.valor - a.valor),
    },
  };
}
