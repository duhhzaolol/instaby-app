import Link from "next/link";
import { ArrowLeft, AlertTriangle, ArrowRight } from "lucide-react";
import { diaFinanceiro, formatarDataFinanceira, limitesMesFinanceiro } from "@/lib/datasFinanceiro";
import { prisma } from "@/lib/prisma";
import { faixaPeriodo, PERIODOS_FINANCEIRO } from "@/lib/periodoFinanceiro";
import { visualDaCategoriaFinanceira } from "@/lib/categoriasFinanceiras";
import { calcularDre } from "@/components/dashboard/dre/calculoDre";
import { exigirPermissao } from "@/lib/permissoes";
import { garantirDespesasRecorrentesDoMes } from "@/lib/garantirRecorrentes";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function margem(valor: number, receita: number) {
  return `${(receita > 0 ? valor / receita * 100 : 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export default async function DrePage({ searchParams }: {
  searchParams: { periodo?: string; desde?: string; ate?: string; base?: string };
}) {
  await exigirPermissao("verFinanceiro");
  await garantirDespesasRecorrentesDoMes();
  const periodo = PERIODOS_FINANCEIRO.some(p => p.valor === searchParams.periodo) ? searchParams.periodo! : "mes_atual";
  const base = searchParams.base === "competencia" ? "competencia" : "caixa";
  const agora = new Date();
  const { desde, ate: ateCaixa } = faixaPeriodo(periodo, { desde: searchParams.desde, ate: searchParams.ate }, agora);
  const ateCompetencia = periodo === "mes_atual"
    ? new Date(limitesMesFinanceiro(diaFinanceiro(desde).slice(0, 7)).fim.getTime() - 1)
    : ateCaixa;
  const ate = base === "caixa" ? ateCaixa : ateCompetencia;
  const [cobrancas, despesas] = await Promise.all([
    prisma.cobranca.findMany({ include: { pagamentos: true } }),
    prisma.despesa.findMany({ include: { pagamentos: true } }),
  ]);
  const { caixa, competencia } = calcularDre({ cobrancas, despesas, desde, ateCaixa, ateCompetencia, agora });
  const url = (alteracoes: { base?: string; periodo?: string }, caminho = "/dashboard/financeiro/dre") => {
    const parametros = new URLSearchParams({ periodo: alteracoes.periodo || periodo });
    if (caminho.endsWith("/dre")) parametros.set("base", alteracoes.base || base);
    if ((alteracoes.periodo || periodo) === "personalizado") {
      if (searchParams.desde) parametros.set("desde", searchParams.desde);
      if (searchParams.ate) parametros.set("ate", searchParams.ate);
    }
    return `${caminho}?${parametros.toString()}`;
  };

  return (
    <div className="max-w-5xl">
      <Link href="/dashboard/financeiro" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
        <ArrowLeft size={15} /> Financeiro
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text">Resultado financeiro</h1>
          <p className="mt-1 text-sm text-muted">Recebimentos, pagamentos e DRE por competência.</p>
        </div>
        <nav aria-label="Período do resultado" className="flex flex-wrap gap-2">
          {PERIODOS_FINANCEIRO.map(p => (
            <Link key={p.valor} href={url({ periodo: p.valor })} aria-current={periodo === p.valor ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${periodo === p.valor ? "bg-accent text-white" : "border border-border text-muted hover:text-text"}`}>
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      {periodo === "personalizado" && (
        <form action="/dashboard/financeiro/dre" className="mb-5 flex flex-wrap items-end gap-3">
          <input type="hidden" name="periodo" value="personalizado" />
          <input type="hidden" name="base" value={base} />
          <label className="text-xs text-muted">De
            <input type="date" name="desde" required defaultValue={searchParams.desde || diaFinanceiro(desde)} className="mt-1 block min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text [color-scheme:dark] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
          </label>
          <label className="text-xs text-muted">Até
            <input type="date" name="ate" required defaultValue={searchParams.ate || diaFinanceiro(ate)} className="mt-1 block min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text [color-scheme:dark] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
          </label>
          <button className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Consultar</button>
        </form>
      )}

      <nav aria-label="Base do resultado" className="mb-6 flex gap-1 border-b border-border">
        {[
          { valor: "caixa", titulo: "Recebido e pago" },
          { valor: "competencia", titulo: "DRE por competência" },
        ].map(opcao => (
          <Link key={opcao.valor} href={url({ base: opcao.valor })} aria-current={base === opcao.valor ? "page" : undefined}
            className={`inline-flex min-h-12 items-center justify-center border-b-2 px-3 text-center text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:px-5 ${base === opcao.valor ? "border-accent text-text" : "border-transparent text-muted hover:text-text"}`}>
            {opcao.titulo}
          </Link>
        ))}
      </nav>

      <div className="mb-5 max-w-3xl">
        <h2 className="text-lg font-medium text-text">{base === "caixa" ? "O que já entrou e saiu" : "Resultado dos lançamentos do período"}</h2>
        <p className="mt-1 text-sm tabular-nums text-muted">{formatarDataFinanceira(desde)} a {formatarDataFinanceira(ate)}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {base === "caixa"
            ? "Somente os recebimentos e pagamentos registrados nessas datas, incluindo pagamentos parciais. Cobranças ainda não recebidas não entram neste resultado."
            : "Inclui o valor integral das cobranças e despesas deste período, mesmo que ainda estejam em aberto. Este resultado não representa o dinheiro disponível na conta."}
        </p>
      </div>

      {base === "caixa" ? (
        <section className="rounded-xl border border-border bg-card/60 p-4 sm:p-6" aria-label="Caixa realizado">
          <LinhaDre label="Recebimentos confirmados" valor={caixa.recebido} destaque />
          <LinhaDre label="(−) Pagamentos confirmados" valor={-caixa.pago} />
          <div className="my-3 border-t border-border" />
          <LinhaDre label="Variação do caixa no período" valor={caixa.variacao} final />
          <p className="mt-2 text-xs leading-relaxed text-muted">Diferença entre o que entrou e saiu. O saldo anterior da conta não está incluído aqui.</p>
          {caixa.quantidadeMovimentos === 0 ? (
            <p className="mt-6 text-sm text-muted">Nenhum recebimento ou pagamento registrado neste período. Confira a aba DRE por competência para ver os lançamentos, inclusive os que ainda estão em aberto.</p>
          ) : caixa.pagamentosPorCategoria.length > 0 && (
            <div className="mt-7 border-t border-border pt-5">
              <h3 className="mb-3 text-sm font-medium text-text">Como os pagamentos se dividem</h3>
              <div className="space-y-2.5">
                {caixa.pagamentosPorCategoria.map(item => (
                  <div key={item.categoria} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted">{visualDaCategoriaFinanceira(item.categoria)?.label || "Sem classificação"}</span>
                    <span className="shrink-0 tabular-nums text-text">R$ {fmt(item.valor)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">Investimentos, retiradas e transferências também são saídas de caixa e aparecem nesta divisão.</p>
            </div>
          )}
          <Link href={url({}, "/dashboard/financeiro/fluxo-de-caixa")} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-text underline decoration-border underline-offset-4 hover:decoration-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            Ver saldo da conta e movimentações <ArrowRight size={15} />
          </Link>
        </section>
      ) : (
        <>
          <div className="mb-5 grid gap-4 border-y border-border py-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">Ainda a receber destes lançamentos</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-text">R$ {fmt(competencia.receitaEmAberto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Ainda a pagar destes lançamentos</p>
              <p className="mt-1 text-lg font-medium tabular-nums text-text">R$ {fmt(competencia.despesaEmAberto)}</p>
            </div>
            <p className="text-xs text-muted sm:col-span-2">Considerando as baixas registradas até {formatarDataFinanceira(competencia.confirmadoAte)}. A DRE abaixo mantém o valor integral da competência.</p>
          </div>

          {competencia.semClassificacao > 0 && (
            <Link href="/dashboard/financeiro/contas-a-pagar?categoria=sem_classificacao" className="mb-5 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-sm leading-relaxed text-amber-100">R$ {fmt(competencia.semClassificacao)} em despesas sem classificação ainda não entram na DRE. <span className="underline underline-offset-4">Classificar despesas</span>.</p>
            </Link>
          )}

          <section className="rounded-xl border border-border bg-card/60 p-4 sm:p-6" aria-label="DRE por competência">
            <LinhaDre label="Receita bruta por competência" valor={competencia.receitaBruta} destaque />
            <LinhaDre label="(−) Impostos sobre vendas" valor={-competencia.impostos} sub />
            <LinhaDre label="= Receita líquida" valor={competencia.receitaLiquida} total />
            <div className="my-4 border-t border-border" />
            <LinhaDre label="(−) Custos diretos" valor={-competencia.custos} sub />
            <LinhaDre label="= Lucro bruto" valor={competencia.lucroBruto} total />
            <p className="mt-1 text-xs text-muted">Margem bruta: {margem(competencia.lucroBruto, competencia.receitaLiquida)}</p>
            <div className="my-4 border-t border-border" />
            <LinhaDre label="(−) Despesas operacionais" valor={-competencia.despesasOperacionais} sub />
            {competencia.categoriasOperacionais.length > 0 && (
              <div className="mb-3 ml-2 space-y-2 border-l border-border py-2 pl-3">
                {competencia.categoriasOperacionais.map(item => (
                  <div key={item.categoria} className="flex items-start justify-between gap-4 text-xs text-muted">
                    <span>{item.categoria}</span><span className="shrink-0 tabular-nums">R$ {fmt(item.valor)}</span>
                  </div>
                ))}
              </div>
            )}
            <LinhaDre label="= Lucro operacional" valor={competencia.lucroOperacional} total />
            <p className="mt-1 text-xs text-muted">Margem operacional: {margem(competencia.lucroOperacional, competencia.receitaLiquida)}</p>
            <div className="my-4 border-t border-border" />
            <LinhaDre label="(−) Despesas financeiras" valor={-competencia.despesasFinanceiras} sub />
            <LinhaDre label="= Lucro líquido" valor={competencia.lucroLiquido} total final />
            <p className="mt-1 text-xs text-muted">Margem líquida: {margem(competencia.lucroLiquido, competencia.receitaLiquida)}</p>
          </section>

          {(competencia.investimentos > 0 || competencia.transferencias > 0) && (
            <div className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
              {competencia.investimentos > 0 && <p>R$ {fmt(competencia.investimentos)} em investimentos/ativos lançados no período. A compra não entra como despesa operacional nesta DRE; os pagamentos aparecem na aba Recebido e pago.</p>}
              {competencia.transferencias > 0 && <p>R$ {fmt(competencia.transferencias)} em retiradas/transferências lançadas no período. Elas ficam fora do lucro operacional; as baixas aparecem na aba Recebido e pago.</p>}
            </div>
          )}
          <p className="mt-5 text-xs leading-relaxed text-muted">A competência da receita usa a data informada na cobrança, depois o vencimento e, quando ambos estiverem vazios, a criação. Para as despesas, usa a data de competência do lançamento.</p>
        </>
      )}
    </div>
  );
}

function LinhaDre({ label, valor, sub, total, destaque, final }: {
  label: string; valor: number; sub?: boolean; total?: boolean; destaque?: boolean; final?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${total ? "border-t border-border pt-3 font-medium" : ""} ${final ? "text-base font-semibold" : "text-sm"}`}>
      <span className={sub ? "text-muted" : "text-text"}>{label}</span>
      <span className={`shrink-0 tabular-nums ${final ? valor >= 0 ? "text-emerald-300" : "text-red-300" : valor < 0 ? "text-red-300" : destaque ? "font-medium text-text" : "text-text"}`}>
        {valor < 0 ? "− " : ""}R$ {fmt(Math.abs(valor))}
      </span>
    </div>
  );
}
