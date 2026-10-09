import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  Clock3,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  DespesaRow,
  type DespesaRowData,
} from "@/components/dashboard/DespesaRow";
import { NovaContaPagarForm } from "@/components/dashboard/NovaContaPagarForm";
import { FiltrosContasAPagar } from "@/components/dashboard/FiltrosContasAPagar";
import { PrevisaoContasRecorrentes } from "@/components/dashboard/PrevisaoContasRecorrentes";
import { garantirDespesasRecorrentesDoMes } from "@/lib/garantirRecorrentes";
import { preverDespesasRecorrentes, proximoMesFinanceiro } from "@/lib/previsaoDespesasRecorrentes";
import { exigirPermissao } from "@/lib/permissoes";
import { categoriaFinanceiraDaDespesa } from "@/lib/classificacaoDespesa";
import { calcularStatusEfetivo } from "@/lib/statusFinanceiro";
import {
  diaFinanceiro,
  hojeFinanceiro,
  mesFinanceiro,
} from "@/lib/datasFinanceiro";

export const dynamic = "force-dynamic";
const ABAS = [
  { valor: "abertas", label: "Em aberto" },
  { valor: "pendente", label: "Pendentes e parciais" },
  { valor: "atrasado", label: "Atrasadas" },
  { valor: "proximos", label: "Próximos 7 dias" },
  { valor: "pago", label: "Pagas" },
  { valor: "todas", label: "Todas" },
];
const ABERTOS = ["pendente", "parcial", "atrasado"];
const fmt = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function ContasAPagarPage({
  searchParams,
}: {
  searchParams: { aba?: string; categoria?: string; periodo?: string };
}) {
  await exigirPermissao("verFinanceiro");
  // A página e o layout podem carregar em paralelo. Aguardar aqui garante que
  // as contas do mês já existam antes da consulta que será mostrada na tela.
  await garantirDespesasRecorrentesDoMes();
  const aba = ABAS.some((a) => a.valor === searchParams.aba)
    ? searchParams.aba!
    : "abertas";
  const filtroCategoria = searchParams.categoria || "";
  const filtroPeriodo = ["mes_atual", "mes_anterior"].includes(
    searchParams.periodo || "",
  )
    ? searchParams.periodo!
    : "";
  const hoje = hojeFinanceiro();
  const hojeChave = diaFinanceiro(hoje);
  const limite7 = diaFinanceiro(new Date(hoje.getTime() + 7 * 86400000));
  const mesAtual = mesFinanceiro(hoje);
  const [ano, mes] = mesAtual.split("-").map(Number);
  const mesAnterior = mesFinanceiro(new Date(Date.UTC(ano, mes - 2, 15, 12)));
  const [despesas, clientes] = await Promise.all([
    prisma.despesa.findMany({
      include: { cliente: true, pagamentos: true },
      orderBy: [{ vencimento: "asc" }, { data: "desc" }],
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  const proximoMes = proximoMesFinanceiro();
  const previsoes = preverDespesasRecorrentes(despesas, proximoMes).filter(d => {
    if (filtroCategoria === "sem_classificacao") {
      const fonte = despesas.find(registro => registro.id === (d.lancamentoId || d.modeloId));
      return !fonte?.categoriaFinanceira;
    }
    return !filtroCategoria || d.categoriaFinanceira === filtroCategoria;
  });
  const registros = despesas.map((d) => {
    const totalPago =
      d.pagamentos.reduce((s, p) => s + Math.round(Number(p.valor) * 100), 0) /
      100;
    const statusEfetivo = calcularStatusEfetivo({
      status: d.status,
      valor: Number(d.valor),
      totalPago,
      vencimento: d.vencimento,
    });
    const saldo = ABERTOS.includes(statusEfetivo)
      ? Math.max(
          0,
          Math.round(Number(d.valor) * 100) - Math.round(totalPago * 100),
        ) / 100
      : 0;
    return {
      d,
      totalPago,
      statusEfetivo,
      saldo,
      categoriaFinanceira: categoriaFinanceiraDaDespesa(d),
      mes: mesFinanceiro(d.data),
      vencimento: d.vencimento ? diaFinanceiro(d.vencimento) : null,
    };
  });
  const base = registros.filter((r) => {
    if (filtroCategoria === "sem_classificacao" && r.d.categoriaFinanceira)
      return false;
    if (
      filtroCategoria &&
      filtroCategoria !== "sem_classificacao" &&
      r.categoriaFinanceira !== filtroCategoria
    )
      return false;
    if (filtroPeriodo === "mes_atual" && r.mes !== mesAtual) return false;
    if (filtroPeriodo === "mes_anterior" && r.mes !== mesAnterior) return false;
    return true;
  });
  const todasRelevantes = base.filter((r) => {
    if (aba === "todas") return true;
    if (aba === "pago") return r.statusEfetivo === "pago";
    if (aba === "pendente")
      return ["pendente", "parcial"].includes(r.statusEfetivo);
    if (aba === "atrasado") return r.statusEfetivo === "atrasado";
    if (aba === "proximos")
      return (
        r.saldo > 0 &&
        !!r.vencimento &&
        r.vencimento > hojeChave &&
        r.vencimento <= limite7
      );
    return r.saldo > 0;
  });
  if (aba === "pago") {
    todasRelevantes.sort((a, b) => b.d.data.getTime() - a.d.data.getTime());
  }
  const abertas = todasRelevantes.filter((r) => r.saldo > 0);
  const vencendoHoje = abertas.filter((r) => r.vencimento === hojeChave);
  const vencendo7dias = abertas.filter(
    (r) =>
      !!r.vencimento && r.vencimento > hojeChave && r.vencimento <= limite7,
  );
  const emAtraso = abertas.filter((r) => r.statusEfetivo === "atrasado");
  const soma = (itens: typeof abertas) =>
    itens.reduce((total, r) => total + Math.round(r.saldo * 100), 0) / 100;
  function link(outraAba: string) {
    const params = new URLSearchParams({ aba: outraAba });
    if (filtroCategoria) params.set("categoria", filtroCategoria);
    if (filtroPeriodo) params.set("periodo", filtroPeriodo);
    return `/dashboard/financeiro/contas-a-pagar?${params.toString()}`;
  }

  return (
    <div>
      <Link
        href="/dashboard/financeiro"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      >
        <ArrowLeft size={13} /> Financeiro
      </Link>
      <p className="mb-1 text-lg font-medium text-text">Contas a Pagar</p>
      <p className="mb-6 text-sm text-muted">
        Acompanhe o saldo das despesas, incluindo pagamentos parciais.
      </p>
      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={12} /> Total a pagar
          </p>
          <p className="text-lg font-medium text-text">
            R$ {fmt(soma(abertas))}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-amber-300">
            <Clock3 size={12} /> Vencendo hoje
          </p>
          <p className="text-lg font-medium text-amber-300">
            {vencendoHoje.length} · R$ {fmt(soma(vencendoHoje))}
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-sky-300">
            <CalendarClock size={12} /> Próx. 7 dias
          </p>
          <p className="text-lg font-medium text-sky-300">
            {vencendo7dias.length} · R$ {fmt(soma(vencendo7dias))}
          </p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} /> Em atraso
          </p>
          <p className="text-lg font-medium text-red-300">
            {emAtraso.length} · R$ {fmt(soma(emAtraso))}
          </p>
        </div>
      </div>
      <p className="mb-5 text-[11px] text-muted">
        Os totais seguem a categoria, o período e a situação selecionados.
        Mostram somente o saldo que ainda falta pagar.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.valor}
            href={link(a.valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${aba === a.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"}`}
          >
            {a.label}
          </Link>
        ))}
      </div>
      <FiltrosContasAPagar
        aba={aba}
        categoria={filtroCategoria}
        periodo={filtroPeriodo}
      />
      <NovaContaPagarForm clientes={clientes} />
      {!todasRelevantes.length ? (
        <p className="text-sm text-muted">Nenhuma despesa com estes filtros.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {todasRelevantes.map(({ d, totalPago, categoriaFinanceira }, i) => {
            const item: DespesaRowData = {
              id: d.id,
              descricao: d.descricao,
              valor: Number(d.valor),
              data: d.data.toISOString(),
              cliente: d.cliente?.nome || null,
              recorrente: d.recorrente || !!d.origemRecorrenteId,
              origemRecorrenteId: d.origemRecorrenteId,
              categoriaFinanceira,
              categoria: d.categoria,
              status: d.status,
              vencimento: d.vencimento?.toISOString() || null,
              totalPago,
            };
            return <div key={d.id} id={`despesa-${d.id}`} className="scroll-mt-36"><DespesaRow despesa={item} index={i} /></div>;
          })}
        </div>
      )}
      {["abertas", "pendente", "todas"].includes(aba) && filtroPeriodo !== "mes_anterior" && (
        <PrevisaoContasRecorrentes mes={proximoMes} contas={previsoes} />
      )}
    </div>
  );
}
