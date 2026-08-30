import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { faixaPeriodo, PERIODOS_FINANCEIRO } from "@/lib/periodoFinanceiro";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

  const [cobrancas, despesas] = await Promise.all([
    prisma.cobranca.findMany({
      where: {
        status: { not: "cancelado" },
        OR: [
          { dataCompetencia: { gte: desde, lte: ate } },
          { AND: [{ dataCompetencia: null }, { createdAt: { gte: desde, lte: ate } }] },
        ],
      },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: desde, lte: ate }, status: { not: "cancelado" } },
    }),
  ]);

  const receitaBruta = cobrancas.reduce((s, c) => s + Number(c.valor), 0);

  const somaPor = (cat: string) =>
    despesas.filter((d) => d.categoriaFinanceira === cat).reduce((s, d) => s + Number(d.valor), 0);

  const impostos = somaPor("imposto");
  const custos = somaPor("custo");
  const despesasFixas = somaPor("despesa_fixa");
  const despesasVariaveis = somaPor("despesa_variavel");
  const despesasFinanceiras = somaPor("despesa_financeira");
  const investimentos = somaPor("investimento");
  const semClassificacao = despesas
    .filter((d) => !d.categoriaFinanceira || d.categoriaFinanceira === "transferencia")
    .reduce((s, d) => s + Number(d.valor), 0);

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
            Demonstrativo de Resultado — por competência, {new Date(desde).toLocaleDateString("pt-BR")} a{" "}
            {new Date(ate).toLocaleDateString("pt-BR")}
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

      {semClassificacao > 0 && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200">
            R$ {fmt(semClassificacao)} em despesas sem classificação (ou marcadas como transferência) não entram
            nessa DRE. Classifica elas no Financeiro pra essa conta ficar completa.
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
        <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5">
          <p className="text-xs text-cyan-200">
            Investimentos/Ativos do período: <strong>R$ {fmt(investimentos)}</strong> — reduziram seu caixa, mas
            não entram nessa DRE (não são despesa operacional).
          </p>
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
