import { despesaDaOperacao, tipoDaDespesa } from "@/lib/classificacaoDespesa";
import { inicioDiaFinanceiro } from "@/lib/datasFinanceiro";
import { DespesaFinanceira, movimentosDeDespesa } from "@/lib/movimentosFinanceiros";

export function resumirCustosFinanceiros<T extends DespesaFinanceira>(
  despesas: T[], desde: Date, ate: Date, agora = new Date(),
) {
  const doPeriodo = despesas.filter(d => d.status !== "cancelado" && d.data &&
    inicioDiaFinanceiro(d.data) >= desde && inicioDiaFinanceiro(d.data) <= ate);
  function grupo(tipo: "fixa" | "flexivel") {
    const itens = doPeriodo.filter(d => despesaDaOperacao(d) && tipoDaDespesa(d) === tipo);
    let total = 0, pago = 0;
    for (const d of itens) {
      const valor = Math.round(Number(d.valor) * 100);
      const baixas = movimentosDeDespesa(d).filter(m => m.data <= agora)
        .reduce((s, m) => s + Math.round(m.valor * 100), 0);
      total += valor;
      pago += Math.min(valor, baixas);
    }
    return { itens, total: total / 100, pago: pago / 100, emAberto: (total - pago) / 100 };
  }
  return { operacionais: grupo("fixa"), flexiveis: grupo("flexivel") };
}
