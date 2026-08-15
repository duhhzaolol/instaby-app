import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function chaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function HorasClientePage({
  params,
  searchParams,
}: {
  params: { clienteId: string };
  searchParams: { mes?: string };
}) {
  const cliente = await prisma.cliente.findUnique({ where: { id: params.clienteId } });
  if (!cliente) notFound();

  const hoje = new Date();
  const [anoParam, mesParam] = (searchParams.mes || `${hoje.getFullYear()}-${hoje.getMonth() + 1}`)
    .split("-")
    .map(Number);
  const ano = anoParam;
  const mes = mesParam - 1;

  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);
  const inicioGrade = new Date(inicioMes);
  inicioGrade.setDate(inicioGrade.getDate() - inicioMes.getDay());
  const fimGrade = new Date(fimMes);
  fimGrade.setDate(fimGrade.getDate() + (6 - fimMes.getDay()));

  const registros = await prisma.registroTempo.findMany({
    where: { clienteId: cliente.id, inicio: { gte: inicioGrade, lte: fimGrade } },
    orderBy: { inicio: "asc" },
  });

  const porDia: Record<string, { atividade: string; horas: number }[]> = {};
  let totalMes = 0;
  registros.forEach((r) => {
    if (!r.fim) return;
    const horas = (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 / 60;
    const chave = chaveDia(r.inicio);
    (porDia[chave] ||= []).push({ atividade: r.atividade, horas });
    if (r.inicio >= inicioMes && r.inicio <= fimMes) totalMes += horas;
  });

  const dias: Date[] = [];
  for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
    dias.push(new Date(d));
  }

  const mesAnterior = new Date(ano, mes - 1, 1);
  const mesSeguinte = new Date(ano, mes + 1, 1);
  const hojeChave = chaveDia(hoje);
  const cor = cliente.cor || "#E63946";

  return (
    <div>
      <Link href="/dashboard/horas" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Horas
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-lg font-medium text-text">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cor }} />
            {cliente.nome}
          </p>
          <p className="text-sm text-muted">Dias trabalhados neste mês, pra conferência</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/horas/${cliente.id}?mes=${mesAnterior.getFullYear()}-${mesAnterior.getMonth() + 1}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronLeft size={15} />
          </Link>
          <p className="w-36 text-center text-sm font-medium text-text">
            {NOMES_MESES[mes]} {ano}
          </p>
          <Link
            href={`/dashboard/horas/${cliente.id}?mes=${mesSeguinte.getFullYear()}-${mesSeguinte.getMonth() + 1}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      <div
        className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3"
        style={{ borderLeft: `3px solid ${cor}` }}
      >
        <span className="text-sm font-medium text-text">Total do mês</span>
        <span className="text-lg font-medium" style={{ color: cor }}>
          {totalMes.toFixed(1)}h
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-card/40">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-[11px] font-medium text-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d) => {
            const chave = chaveDia(d);
            const registrosDoDia = porDia[chave] || [];
            const totalDia = registrosDoDia.reduce((s, r) => s + r.horas, 0);
            const foraDoMes = d.getMonth() !== mes;
            const ehHoje = chave === hojeChave;
            const trabalhou = registrosDoDia.length > 0;

            return (
              <div
                key={chave}
                className={`min-h-[84px] border-b border-r border-border p-1.5 last:border-r-0 ${
                  foraDoMes ? "bg-black/20" : ""
                }`}
                style={trabalhou ? { backgroundColor: `${cor}14` } : undefined}
              >
                <span
                  className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    ehHoje ? "bg-accent text-white" : foraDoMes ? "text-muted/40" : "text-muted"
                  }`}
                >
                  {d.getDate()}
                </span>
                {trabalhou && (
                  <div>
                    <p className="mb-1 text-[11px] font-medium" style={{ color: cor }}>
                      {totalDia.toFixed(1)}h
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {registrosDoDia.slice(0, 2).map((r, i) => (
                        <p key={i} className="truncate text-[9px] text-muted">
                          {r.atividade}
                        </p>
                      ))}
                      {registrosDoDia.length > 2 && (
                        <p className="text-[9px] text-muted">+{registrosDoDia.length - 2}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
