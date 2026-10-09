import Link from "next/link";
import { Repeat } from "lucide-react";
import { formatarDataFinanceira } from "@/lib/datasFinanceiro";
import type { PrevisaoDespesaRecorrente } from "@/lib/previsaoDespesasRecorrentes";

const dinheiro = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const SITUACOES = { previsao: "Previsão", lancada: "Já lançada", paga: "Paga", cancelada: "Cancelada" };

export function PrevisaoContasRecorrentes({ mes, contas }: { mes: string; contas: PrevisaoDespesaRecorrente[] }) {
  const nomeMes = new Date(`${mes}-15T12:00:00-03:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  const total = contas.reduce((s, conta) => s + Math.round(conta.saldo * 100), 0) / 100;

  return (
    <section id="proximo-mes" aria-labelledby="previsao-recorrentes-titulo" className="mt-8 scroll-mt-36 border-t border-border pt-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="previsao-recorrentes-titulo" className="flex items-center gap-2 text-base font-medium text-text">
            <Repeat size={16} aria-hidden="true" /> Próximo mês · {nomeMes}
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            Contas recorrentes para você se preparar. Valores previstos ainda não movimentam o saldo da conta.
          </p>
        </div>
        {contas.length > 0 && <div className="sm:text-right">
          <p className="text-xs text-muted">Reservar para estas contas</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-text">{dinheiro(total)}</p>
        </div>}
      </div>
      {contas.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma conta recorrente nesta categoria. Ao cadastrar ou editar a conta original, marque “Repetir esta conta todo mês”.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card/40 px-4">
          {contas.map(conta => <li key={conta.modeloId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5">
            <div className="min-w-0 flex-1 basis-48">
              <p className="break-words text-sm font-medium text-text">{conta.descricao}</p>
              <p className="mt-1 text-xs text-muted">
                Vence em {formatarDataFinanceira(conta.vencimento)}{conta.categoria && ` · ${conta.categoria}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums text-text">{dinheiro(conta.saldo)}</p>
              {conta.lancamentoId ? <Link
                href={`/dashboard/financeiro/contas-a-pagar?aba=todas#despesa-${conta.lancamentoId}`}
                className="inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-text focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >{SITUACOES[conta.situacao]} · ver lançamento</Link> : <p className="mt-1 text-xs text-muted">Previsão</p>}
            </div>
          </li>)}
        </ul>
      )}
      {contas.some(conta => conta.situacao === "previsao") && <p className="mt-3 max-w-prose text-xs text-muted">
        A conta do mês será lançada automaticamente quando o mês começar, usando o valor cadastrado. Água, energia e outros valores variáveis podem ser ajustados no lançamento.
      </p>}
      {contas.some(conta => conta.lancamentoId) && <p className="mt-2 max-w-prose text-xs text-muted">As contas identificadas como já lançadas também estão na lista de lançamentos. Não some os dois totais.</p>}
    </section>
  );
}
