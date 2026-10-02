import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarClock,
  Clock3,
  Wallet,
  Repeat2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  CobrancaRow,
  type CobrancaRowData,
} from "@/components/dashboard/CobrancaRow";
import { NovaContaReceberForm } from "@/components/dashboard/NovaContaReceberForm";
import { RecorrenciaClienteFinanceiro } from "@/components/dashboard/RecorrenciaClienteFinanceiro";
import { getUsuarioAtual, permissoesDe } from "@/lib/permissoes";
import { calcularStatusEfetivo } from "@/lib/statusFinanceiro";
import { calcularMensalidade, competenciaCobranca } from "@/lib/mensalidades";
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
  { valor: "pago", label: "Recebidas" },
  { valor: "todas", label: "Todas" },
];
const ABERTOS = ["pendente", "parcial", "atrasado"];
const fmt = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
function nomeMes(mes: string) {
  return new Date(`${mes}-15T12:00:00-03:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
    year: "numeric",
  });
}

export default async function ContasAReceberPage({
  searchParams,
}: {
  searchParams: { aba?: string; mes?: string; cliente?: string };
}) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const podeEditar = permissoesDe(usuario).gerenciarFinanceiro;
  const aba = ABAS.some((a) => a.valor === searchParams.aba)
    ? searchParams.aba!
    : "abertas";
  const hoje = hojeFinanceiro();
  const hojeChave = diaFinanceiro(hoje);
  const limite7 = diaFinanceiro(new Date(hoje.getTime() + 7 * 86400000));
  const mesAtual = mesFinanceiro(hoje);
  const filtroMes =
    searchParams.mes === "todos"
      ? "todos"
      : /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(searchParams.mes || "")
        ? searchParams.mes!
        : mesAtual;
  const filtroCliente = searchParams.cliente || "";

  const [cobrancas, clientes] = await Promise.all([
    prisma.cobranca.findMany({
      include: { cliente: true, pagamentos: true },
      orderBy: [{ vencimento: "asc" }, { createdAt: "desc" }],
    }),
    prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        status: true,
        descontoMensal: true,
        acrescimoMensal: true,
        cobrancaRecorrenteAtiva: true,
        cobrancaRecorrenteInicio: true,
        cobrancaDiaVencimento: true,
        servicosContratados: {
          where: { ativo: true },
          select: { valor: true },
        },
      },
      orderBy: { nome: "asc" },
    }),
  ]);
  const registros = cobrancas.map((c) => {
    const totalPago =
      c.pagamentos.reduce((s, p) => s + Math.round(Number(p.valor) * 100), 0) /
      100;
    const statusEfetivo = calcularStatusEfetivo({
      status: c.status,
      valor: Number(c.valor),
      totalPago,
      vencimento: c.vencimento,
    });
    const saldo = ABERTOS.includes(statusEfetivo)
      ? Math.max(
          0,
          Math.round(Number(c.valor) * 100) - Math.round(totalPago * 100),
        ) / 100
      : 0;
    return {
      c,
      totalPago,
      statusEfetivo,
      saldo,
      mes: competenciaCobranca(c),
      vencimento: c.vencimento ? diaFinanceiro(c.vencimento) : null,
    };
  });
  const meses = Array.from(
    new Set([
      mesAtual,
      ...(filtroMes === "todos" ? [] : [filtroMes]),
      ...registros.map((r) => r.mes),
    ]),
  )
    .sort()
    .reverse();
  const base = registros.filter(
    (r) =>
      (filtroMes === "todos" || r.mes === filtroMes) &&
      (!filtroCliente || r.c.clienteId === filtroCliente),
  );
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
    todasRelevantes.sort(
      (a, b) => b.c.createdAt.getTime() - a.c.createdAt.getTime(),
    );
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
  const clientesRecorrencia = clientes.filter(
    (c) => c.status === "ativo" && (!filtroCliente || c.id === filtroCliente),
  );
  function link(outraAba = aba, outroMes = filtroMes) {
    const params = new URLSearchParams({ aba: outraAba, mes: outroMes });
    if (filtroCliente) params.set("cliente", filtroCliente);
    return `/dashboard/financeiro/contas-a-receber?${params.toString()}`;
  }

  return (
    <div>
      <Link
        href="/dashboard/financeiro"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      >
        <ArrowLeft size={13} /> Financeiro
      </Link>
      <p className="mb-1 text-lg font-medium text-text">Contas a Receber</p>
      <p className="mb-5 text-sm text-muted">
        Acompanhe o saldo das cobranças por mês e cliente.
      </p>

      <form
        key={`${filtroMes}:${filtroCliente}:${aba}`}
        action="/dashboard/financeiro/contas-a-receber"
        method="get"
        className="mb-3 flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="aba" value={aba} />
        <label className="text-xs text-muted">
          Mês de competência
          <select
            name="mes"
            defaultValue={filtroMes}
            aria-label="Mês de competência das cobranças"
            className="mt-1 block h-10 rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="todos">Todos os meses</option>
            {meses.map((m) => (
              <option key={m} value={m}>
                {nomeMes(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[160px] max-w-full text-xs text-muted">
          Cliente
          <select
            name="cliente"
            defaultValue={filtroCliente}
            aria-label="Cliente das cobranças"
            className="mt-1 block h-10 max-w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.status === "inativo" ? " (inativo)" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl bg-accent px-4 text-xs font-medium text-white"
        >
          Aplicar filtros
        </button>
        {filtroMes !== "todos" && (
          <Link
            href={link("abertas", "todos")}
            className="px-2 py-3 text-xs text-accent hover:underline"
          >
            Ver cobranças em aberto de todos os meses
          </Link>
        )}
      </form>
      <p className="mb-5 text-[11px] text-muted">
        Competência é o mês da cobrança. Quando não foi informada, usamos o mês
        do vencimento ou, sem vencimento, o mês do cadastro.
      </p>

      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={12} /> Total a receber
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
        Os totais seguem os filtros selecionados e mostram o saldo que ainda
        falta receber, descontando as baixas.
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
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

      {!!clientesRecorrencia.length && (
        <details className="mb-5 rounded-2xl border border-border bg-card/30 p-4">
          <summary className="cursor-pointer text-sm font-medium text-text">
            <span className="inline-flex items-center gap-1.5">
              <Repeat2 size={14} /> Recorrências dos clientes ·{" "}
              {clientesRecorrencia.length}
            </span>
          </summary>
          <p className="mb-3 mt-3 text-xs text-muted">
            Configure a mensalidade automática de cada cliente ativo. O valor é
            definido nos serviços do cliente.
          </p>
          <div className="max-h-[650px] space-y-3 overflow-y-auto pr-1">
            {clientesRecorrencia.map((c) => (
              <RecorrenciaClienteFinanceiro
                key={c.id}
                clienteId={c.id}
                nome={c.nome}
                mensalidade={calcularMensalidade(c)}
                ativa={c.cobrancaRecorrenteAtiva}
                inicio={c.cobrancaRecorrenteInicio}
                diaVencimento={c.cobrancaDiaVencimento}
                podeEditar={podeEditar}
              />
            ))}
          </div>
        </details>
      )}
      {podeEditar && (
        <NovaContaReceberForm
          clientes={clientes.filter((c) => c.status !== "inativo")}
        />
      )}
      {!todasRelevantes.length ? (
        <p className="text-sm text-muted">
          Nenhuma cobrança com estes filtros. Selecione Todos os meses para
          consultar o histórico.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {todasRelevantes.map(({ c, totalPago, mes }, i) => {
            const item: CobrancaRowData = {
              id: c.id,
              valor: Number(c.valor),
              status: c.status,
              tipo: c.tipo,
              vencimento: c.vencimento?.toISOString() || null,
              totalPago,
              dataCompetencia: c.dataCompetencia?.toISOString() || null,
              createdAt: c.createdAt.toISOString(),
              competencia: mes,
              recorrenciaChave: c.recorrenciaChave,
              categoria: c.categoria,
            };
            return (
              <CobrancaRow
                key={c.id}
                cobranca={item}
                index={i}
                clienteNome={c.cliente.nome}
                clienteId={c.clienteId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
