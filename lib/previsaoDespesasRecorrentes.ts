import { diaFinanceiro, mesFinanceiro } from "@/lib/datasFinanceiro";
import { calcularStatusEfetivo } from "@/lib/statusFinanceiro";
import { categoriaFinanceiraDaDespesa } from "@/lib/classificacaoDespesa";

type DespesaRecorrente = {
  id: string;
  descricao: string;
  valor: unknown;
  data: Date;
  vencimento: Date | null;
  status: string;
  recorrente: boolean;
  tipo?: string | null;
  origemRecorrenteId: string | null;
  categoriaFinanceira?: string | null;
  categoria?: string | null;
  pagamentos?: { valor: unknown }[];
};

export type PrevisaoDespesaRecorrente = {
  modeloId: string;
  lancamentoId: string | null;
  descricao: string;
  valor: number;
  saldo: number;
  vencimento: Date;
  categoriaFinanceira: string | null;
  categoria: string | null;
  situacao: "previsao" | "lancada" | "paga" | "cancelada";
};

export function proximoMesFinanceiro(agora = new Date()): string {
  const [ano, mes] = diaFinanceiro(agora, false).slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 7);
}

/** Projeta apenas os modelos ativos. Não cria lançamentos nem movimenta o caixa. */
export function preverDespesasRecorrentes(
  despesas: DespesaRecorrente[],
  competencia: string,
  agora = new Date(),
): PrevisaoDespesaRecorrente[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) return [];
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  return despesas
    .filter(d => d.recorrente && d.status !== "cancelado" && mesFinanceiro(d.data) <= competencia)
    .map(modelo => {
      // A ocorrência já registrada, mesmo paga/cancelada, ganha da previsão.
      const lancamento = despesas.find(d =>
        (d.id === modelo.id || d.origemRecorrenteId === modelo.id) &&
        mesFinanceiro(d.data) === competencia,
      );
      const dia = Math.min(ultimoDia, Number(diaFinanceiro(modelo.vencimento || modelo.data).slice(8)));
      const vencimento = lancamento?.vencimento || new Date(`${competencia}-${String(dia).padStart(2, "0")}T00:00:00-03:00`);
      const valor = Number(lancamento?.valor ?? modelo.valor);
      const totalPago = (lancamento?.pagamentos || []).reduce((s, p) => s + Math.round(Number(p.valor) * 100), 0) / 100;
      const status = lancamento ? calcularStatusEfetivo({ status: lancamento.status, valor, totalPago, vencimento }, agora) : null;
      const encerrada = status === "pago" || status === "cancelado";
      return {
        modeloId: modelo.id,
        lancamentoId: lancamento?.id || null,
        descricao: lancamento?.descricao || modelo.descricao,
        valor,
        saldo: encerrada ? 0 : Math.max(0, Math.round(valor * 100) - Math.round(totalPago * 100)) / 100,
        vencimento,
        categoriaFinanceira: categoriaFinanceiraDaDespesa(lancamento || modelo),
        categoria: lancamento?.categoria ?? modelo.categoria ?? null,
        situacao: !lancamento ? "previsao" as const : status === "pago" ? "paga" as const : status === "cancelado" ? "cancelada" as const : "lancada" as const,
      };
    })
    .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime() || a.descricao.localeCompare(b.descricao, "pt-BR"));
}
