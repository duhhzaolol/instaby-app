import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { inicioDiaFinanceiro, formatarDataFinanceira } from "@/lib/datasFinanceiro";
import { prisma } from "@/lib/prisma";
import { faixaPeriodo, PERIODOS_FINANCEIRO, dataCompetenciaDaCobranca } from "@/lib/periodoFinanceiro";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v: number) {
  return `${v >= 0 ? "" : "−"}${Math.abs(v).toFixed(1)}%`;
}

export default async function DrePage({
  searchParams,
}: {
  searchParams: { periodo?: string; desde?: string; ate?: string };
}) {
  const periodo = searchParams.periodo || "mes_atual";
  const { desde, ate } = faixaPeriodo(periodo, { desde: searchParams.desde, ate: searchParams.ate });

  const inicioConsultaCivil = new Date(desde.getTime() - 3 * 60 * 60 * 1000);
  const [cobrancasConsulta, despesasConsulta] = await Promise.all([
    prisma.cobranca.findMany({ where: { status: { not: "cancelado" } } }),
    prisma.despesa.findMany({
      where: { data: { gte: inicioConsultaCivil, lte: ate }, status: { not: "cancelado" } },
    }),
  ]);

  const cobrancas = cobrancasConsulta.filter(c => {
    const competencia = dataCompetenciaDaCobranca(c);
    return competencia >= desde && competencia <= ate;
  });
  const despesas = despesasConsulta.filter(d => inicioDiaFinanceiro(d.data) >= desde && inicioDiaFinanceiro(d.data) <= ate);
  const soma = (valores: number[]) => valores.reduce((total, valor) => total + Math.round(valor * 100), 0) / 100;
  const receitaBruta = soma(cobrancas.map(c => Number(c.valor)));

  const somaPor = (cat: string) =>
    soma(despesas.filter((d) => d.categoriaFinanceira === cat).map(d => Number(d.valor)));

  const impostos = somaPor("imposto");
  const custos = somaPor("custo");
  const despesasFixas = somaPor("despesa_fixa");
  const despesasVariaveis = somaPor("despesa_variavel");
  const despesasFinanceiras = somaPor("despesa_financeira");
  const investimentos = somaPor("investimento");
  // Só o que realmente falta classificar — retirada/transferência já é uma classificação
  // válida (só não conta como despesa operacional), não é um "buraco" a corrigir.
  const semClassificacao = despesas
    .filter((d) => !d.categoriaFinanceira)
    .reduce((s, d) => s + Number(d.valor), 0);
  const transferencias = somaPor("transferencia");

  const receitaLiquida = receitaBruta - impostos;
  const lucroBruto = receitaLiquida - custos;
  const despesasOperacionais = despesasFixas + despesasVariaveis;
  const lucroOperacional = lucroBruto - despesasOperacionais;
  const lucroLiquido = lucroOperacional - despesasFinanceiras;

  const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
  const margemOperacional = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
  const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

  // Detalhamento por categoria dentro de despesas operacionais
  const porCategoriaOperacional: Record<string, number> = {};
  despesas
    .filter((d) => d.categoriaFinanceira === "despesa_fixa" || d.categoriaFinanceira === "despesa_variavel")
    .forEach((d) => {
      const chave = d.categoria || (d.categoriaFinanceira === "despesa_fixa" ? "Outras despesas fixas" : "Outras despesas variáveis");
      porCategoriaOperacional[chave] = (porCategoriaOperacional[chave] || 0) + Number(d.valor);
    });
  const categoriasOrdenadas = Object.entries(porCategoriaOperacional).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <Link href="/dashboard/financeiro" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Financeiro
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-medium text-text">DRE</p>
          <p className="text-sm text-muted">
            Demonstrativo de Resultado — por competência, {formatarDataFinanceira(desde)} a{" "}
            {formatarDataFinanceira(ate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS_FINANCEIRO.map((p) => (
            <Link
              key={p.valor}
              href={`/dashboard/financeiro/dre?periodo=${p.valor}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === p.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">A competência da receita usa o dia informado na cobrança. Quando ele não foi definido, usa o vencimento e, se também não houver vencimento, a criação. Os recebimentos e pagamentos efetivos ficam no Fluxo de Caixa.</p>

      {semClassificacao > 0 && (
        <Link
          href="/dashboard/financeiro/contas-a-pagar?categoria=sem_classificacao"
          className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 hover:bg-amber-500/10"
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200">
            R$ {fmt(semClassificacao)} em despesas sem classificação não entram nessa DRE.{" "}
            <span className="underline">Clique aqui pra classificar</span> e essa conta ficar completa.
          </p>
        </Link>
      )}

      {transferencias > 0 && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-border bg-card/40 p-3.5">
          <p className="text-xs text-muted">
            R$ {fmt(transferencias)} em retiradas/transferências no período — já classificadas, só não entram nessa
            DRE porque não são despesa operacional (aparecem no Fluxo de Caixa normalmente).
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
        <LinhaDre label="Receita Bruta" valor={receitaBruta} destaque />
        <LinhaDre label="(−) Impostos sobre vendas" valor={-impostos} sub />
        <LinhaDre label="(−) Descontos / cancelamentos" valor={0} sub nota="não rastreado ainda" />
        <LinhaDre label="= Receita Líquida" valor={receitaLiquida} total />

        <div className="my-4 border-t border-border" />

        <LinhaDre label="(−) Custos diretos" valor={-custos} sub />
        <LinhaDre label="= Lucro Bruto" valor={lucroBruto} total />
        <p className="mb-4 text-xs text-muted">Margem bruta: {pct(margemBruta)}</p>

        <div className="my-4 border-t border-border" />

        <LinhaDre label="(−) Despesas Operacionais" valor={-despesasOperacionais} sub />
        {categoriasOrdenadas.length > 0 && (
          <div className="mb-3 ml-4 flex flex-col gap-1 border-l border-border pl-3">
            {categoriasOrdenadas.map(([cat, valor]) => (
              <div key={cat} className="flex items-center justify-between text-xs text-muted">
                <span>{cat}</span>
                <span>R$ {fmt(valor)}</span>
              </div>
            ))}
          </div>
        )}
        <LinhaDre label="= Lucro Operacional" valor={lucroOperacional} total />
        <p className="mb-4 text-xs text-muted">Margem operacional: {pct(margemOperacional)}</p>

        <div className="my-4 border-t border-border" />

        <LinhaDre label="(−) Despesas Financeiras" valor={-despesasFinanceiras} sub />
        <LinhaDre label="= Lucro Líquido" valor={lucroLiquido} total final />
        <p className="text-xs text-muted">Margem líquida: {pct(margemLiquida)}</p>
      </div>

      {investimentos > 0 && (
        <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <p className="mb-3 text-xs text-cyan-200">
            Investimentos/Ativos lançados no período: <strong>R$ {fmt(investimentos)}</strong>. Esses valores não entram no resultado operacional. Os pagamentos realizados aparecem no Fluxo de Caixa; este quadro usa a competência dos lançamentos.
          </p>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Lucro líquido por competência</span>
              <span className="text-text">R$ {fmt(lucroLiquido)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Investimentos lançados</span>
              <span className="text-red-400">− R$ {fmt(investimentos)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-cyan-500/20 pt-1.5 font-medium">
              <span className="text-cyan-200">Resultado considerando investimentos</span>
              <span className={lucroLiquido - investimentos >= 0 ? "text-emerald-400" : "text-red-400"}>
                R$ {fmt(lucroLiquido - investimentos)}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/financeiro/fluxo-de-caixa"
            className="mt-3 inline-block text-[11px] text-cyan-300 hover:underline"
          >
            Ver Fluxo de Caixa completo →
          </Link>
        </div>
      )}
    </div>
  );
}

function LinhaDre({
  label,
  valor,
  sub,
  total,
  destaque,
  final,
  nota,
}: {
  label: string;
  valor: number;
  sub?: boolean;
  total?: boolean;
  destaque?: boolean;
  final?: boolean;
  nota?: string;
}) {
  const negativo = valor < 0;
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        total ? "border-t border-border pt-2.5 font-medium" : ""
      } ${final ? "text-base" : "text-sm"}`}
    >
      <span className={sub ? "text-muted" : destaque || final ? "text-text" : "text-text"}>
        {label}
        {nota && <span className="ml-1.5 text-[10px] text-muted">({nota})</span>}
      </span>
      <span
        className={
          final
            ? valor >= 0
              ? "font-semibold text-emerald-400"
              : "font-semibold text-red-400"
            : negativo
            ? "text-red-400"
            : destaque
            ? "text-accent"
            : "text-text"
        }
      >
        {negativo ? "− " : ""}R$ {fmt(Math.abs(valor))}
      </span>
    </div>
  );
}
