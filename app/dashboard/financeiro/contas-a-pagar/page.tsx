import Link from "next/link";
import { ArrowLeft, AlertTriangle, CalendarClock, Clock3, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DespesaRow, DespesaRowData } from "@/components/dashboard/DespesaRow";

const ABAS = [
  { valor: "abertas", label: "Pendentes + Atrasadas" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "atrasado", label: "Atrasadas" },
  { valor: "proximos", label: "Próximos 7 dias" },
  { valor: "pago", label: "Pagas" },
  { valor: "todas", label: "Todas" },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default async function ContasAPagarPage({
  searchParams,
}: {
  searchParams: { aba?: string };
}) {
  const aba = searchParams.aba || "abertas";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);
  const seisMesesAtras = new Date(hoje);
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

  const [abertas, todasRelevantes] = await Promise.all([
    prisma.despesa.findMany({
      where: { status: { in: ["pendente", "atrasado"] } },
      include: { cliente: true },
      orderBy: { vencimento: "asc" },
    }),
    prisma.despesa.findMany({
      where:
        aba === "todas"
          ? { data: { gte: seisMesesAtras } }
          : aba === "pago"
          ? { status: "pago", data: { gte: seisMesesAtras } }
          : aba === "pendente"
          ? { status: "pendente" }
          : aba === "atrasado"
          ? { status: "atrasado" }
          : aba === "proximos"
          ? { status: { in: ["pendente", "atrasado"] }, vencimento: { gte: hoje, lte: em7dias } }
          : { status: { in: ["pendente", "atrasado"] } },
      include: { cliente: true },
      orderBy: aba === "pago" ? { data: "desc" } : { vencimento: "asc" },
    }),
  ]);

  const vencendoHoje = abertas.filter((d) => d.vencimento && new Date(d.vencimento).toDateString() === hoje.toDateString());
  const vencendo7dias = abertas.filter(
    (d) => d.vencimento && new Date(d.vencimento) > hoje && new Date(d.vencimento) <= em7dias
  );
  const emAtraso = abertas.filter((d) => d.vencimento && new Date(d.vencimento) < hoje);
  const totalAPagar = abertas.reduce((s, d) => s + Number(d.valor), 0);

  return (
    <div>
      <Link href="/dashboard/financeiro" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Financeiro
      </Link>

      <p className="mb-1 text-lg font-medium text-text">Contas a Pagar</p>
      <p className="mb-6 text-sm text-muted">Despesas pendentes e atrasadas, num lugar só</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={12} /> Total a pagar
          </p>
          <p className="text-lg font-medium text-text">R$ {fmt(totalAPagar)}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-amber-300">
            <Clock3 size={12} /> Vencendo hoje
          </p>
          <p className="text-lg font-medium text-amber-300">
            {vencendoHoje.length} · R$ {fmt(vencendoHoje.reduce((s, d) => s + Number(d.valor), 0))}
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-sky-300">
            <CalendarClock size={12} /> Próx. 7 dias
          </p>
          <p className="text-lg font-medium text-sky-300">
            {vencendo7dias.length} · R$ {fmt(vencendo7dias.reduce((s, d) => s + Number(d.valor), 0))}
          </p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} /> Em atraso
          </p>
          <p className="text-lg font-medium text-red-300">
            {emAtraso.length} · R$ {fmt(emAtraso.reduce((s, d) => s + Number(d.valor), 0))}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/financeiro/contas-a-pagar?aba=${a.valor}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              aba === a.valor ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {todasRelevantes.length === 0 ? (
        <p className="text-sm text-muted">Nada por aqui.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {todasRelevantes.map((d, i) => {
            const item: DespesaRowData = {
              id: d.id,
              descricao: d.descricao,
              valor: Number(d.valor),
              data: d.data.toISOString(),
              cliente: d.cliente?.nome || null,
              recorrente: d.recorrente || !!d.origemRecorrenteId,
              categoriaFinanceira: d.categoriaFinanceira,
              categoria: d.categoria,
              status: d.status,
              vencimento: d.vencimento?.toISOString() || null,
            };
            return <DespesaRow key={d.id} despesa={item} index={i} />;
          })}
        </div>
      )}
    </div>
  );
}
