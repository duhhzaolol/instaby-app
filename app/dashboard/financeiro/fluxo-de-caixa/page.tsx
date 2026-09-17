import Link from "next/link";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { faixaPeriodo, PERIODOS_FINANCEIRO } from "@/lib/periodoFinanceiro";
import { AjudaContextual } from "@/components/ui/AjudaContextual";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default async function FluxoDeCaixaPage({
  searchParams,
}: {
  searchParams: { periodo?: string; desde?: string; ate?: string };
}) {
  const periodo = searchParams.periodo || "mes_atual";
  const { desde, ate } = faixaPeriodo(periodo, { desde: searchParams.desde, ate: searchParams.ate });

  const [entradasPeriodo, saidasPeriodo, entradasAntes, saidasAntes] = await Promise.all([
    prisma.cobranca.findMany({
      where: { status: "pago", createdAt: { gte: desde, lte: ate } },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.despesa.findMany({
      where: { status: "pago", data: { gte: desde, lte: ate } },
      include: { cliente: true },
      orderBy: { data: "desc" },
    }),
    // Tudo que aconteceu antes do início do período — pra calcular o saldo inicial
    prisma.cobranca.aggregate({ where: { status: "pago", createdAt: { lt: desde } }, _sum: { valor: true } }),
    prisma.despesa.aggregate({ where: { status: "pago", data: { lt: desde } }, _sum: { valor: true } }),
  ]);

  const saldoInicial = Number(entradasAntes._sum.valor || 0) - Number(saidasAntes._sum.valor || 0);
  const totalEntradas = entradasPeriodo.reduce((s, c) => s + Number(c.valor), 0);
  const totalSaidas = saidasPeriodo.reduce((s, d) => s + Number(d.valor), 0);
  const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

  // Junta entradas e saídas numa linha do tempo só, mais recente primeiro
  type Movimento = { data: Date; tipo: "entrada" | "saida"; descricao: string; cliente: string | null; valor: number; categoria?: string | null };
  const movimentos: Movimento[] = [
    ...entradasPeriodo.map((c) => ({
      data: c.createdAt,
      tipo: "entrada" as const,
      descricao: c.categoria || "Recebimento",
      cliente: c.cliente.nome,
      valor: Number(c.valor),
    })),
    ...saidasPeriodo.map((d) => ({
      data: d.data,
      tipo: "saida" as const,
      descricao: d.descricao,
      cliente: d.cliente?.nome || null,
      valor: Number(d.valor),
      categoria: d.categoriaFinanceira,
    })),
  ].sort((a, b) => b.data.getTime() - a.data.getTime());

  return (
    <div>
      <Link href="/dashboard/financeiro" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Financeiro
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Fluxo de Caixa
            <AjudaContextual
              titulo="Fluxo de Caixa"
              texto="Diferente da DRE (que mostra lucro/prejuízo da operação), o Fluxo de Caixa mostra tudo que efetivamente entrou e saiu do banco — inclusive compras de equipamento, retiradas e empréstimos. É esse número que deve bater com sua conta bancária."
              exemplo="Ex.: comprar uma câmera de R$ 4.000 à vista não é despesa operacional na DRE, mas reduz seu caixa aqui."
            />
          </p>
          <p className="text-sm text-muted">
            Entradas e saídas efetivamente pagas/recebidas, {new Date(desde).toLocaleDateString("pt-BR")} a{" "}
            {new Date(ate).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS_FINANCEIRO.map((p) => (
            <Link
              key={p.valor}
              href={`/dashboard/financeiro/fluxo-de-caixa?periodo=${p.valor}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periodo === p.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-2 text-xs text-muted">Saldo inicial</p>
          <p className="text-xl font-medium text-text">R$ {fmt(saldoInicial)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <ArrowUpCircle size={13} className="text-emerald-400" /> Entradas
          </div>
          <p className="text-xl font-medium text-emerald-400">+R$ {fmt(totalEntradas)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <ArrowDownCircle size={13} className="text-red-400" /> Saídas
          </div>
          <p className="text-xl font-medium text-red-400">−R$ {fmt(totalSaidas)}</p>
        </div>
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={13} className="text-accent" /> Saldo final
          </div>
          <p className={`text-xl font-medium ${saldoFinal >= 0 ? "text-text" : "text-red-400"}`}>
            R$ {fmt(saldoFinal)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="mb-4 text-sm font-medium text-text">Movimentações do período</p>
        <div className="flex flex-col gap-2">
          {movimentos.length === 0 && <p className="text-sm text-muted">Nada pago ou recebido nesse período ainda.</p>}
          {movimentos.map((m, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-xl bg-base/60 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    m.tipo === "entrada" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {m.tipo === "entrada" ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                </div>
                <div>
                  <p className="text-sm text-text">{m.descricao}</p>
                  <p className="text-xs text-muted">
                    {m.data.toLocaleDateString("pt-BR")}
                    {m.cliente ? ` · ${m.cliente}` : ""}
                    {m.tipo === "saida" && m.categoria === "investimento" ? " · investimento" : ""}
                  </p>
                </div>
              </div>
              <span className={`shrink-0 text-sm font-medium ${m.tipo === "entrada" ? "text-emerald-400" : "text-red-400"}`}>
                {m.tipo === "entrada" ? "+" : "−"}R$ {fmt(m.valor)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
