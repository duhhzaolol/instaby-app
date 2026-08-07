import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, CircleDollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function chaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const hoje = new Date();
  const [anoParam, mesParam] = (searchParams.mes || `${hoje.getFullYear()}-${hoje.getMonth() + 1}`)
    .split("-")
    .map(Number);
  const ano = anoParam;
  const mes = mesParam - 1; // 0-indexed

  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);
  const inicioGrade = new Date(inicioMes);
  inicioGrade.setDate(inicioGrade.getDate() - inicioMes.getDay());
  const fimGrade = new Date(fimMes);
  fimGrade.setDate(fimGrade.getDate() + (6 - fimMes.getDay()));

  const [cobrancas, tarefas] = await Promise.all([
    prisma.cobranca.findMany({
      where: { vencimento: { gte: inicioGrade, lte: fimGrade } },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.tarefa.findMany({
      where: { prazo: { gte: inicioGrade, lte: fimGrade } },
      include: { cliente: { select: { nome: true } } },
    }),
  ]);

  const eventosPorDia: Record<string, { tipo: "cobranca" | "tarefa"; texto: string; status: string }[]> = {};

  cobrancas.forEach((c) => {
    if (!c.vencimento) return;
    const chave = chaveDia(c.vencimento);
    (eventosPorDia[chave] ||= []).push({
      tipo: "cobranca",
      texto: `${c.cliente.nome} · R$ ${Number(c.valor).toFixed(0)}`,
      status: c.status,
    });
  });

  tarefas.forEach((t) => {
    if (!t.prazo) return;
    const chave = chaveDia(t.prazo);
    (eventosPorDia[chave] ||= []).push({
      tipo: "tarefa",
      texto: t.cliente ? `${t.titulo} · ${t.cliente.nome}` : t.titulo,
      status: t.status,
    });
  });

  const dias: Date[] = [];
  for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
    dias.push(new Date(d));
  }

  const mesAnterior = new Date(ano, mes - 1, 1);
  const mesSeguinte = new Date(ano, mes + 1, 1);
  const hojeChave = chaveDia(hoje);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">Agenda</p>
          <p className="text-sm text-muted">Vencimentos e prazos num só lugar</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/agenda?mes=${mesAnterior.getFullYear()}-${mesAnterior.getMonth() + 1}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronLeft size={15} />
          </Link>
          <p className="w-36 text-center text-sm font-medium text-text">
            {NOMES_MESES[mes]} {ano}
          </p>
          <Link
            href={`/dashboard/agenda?mes=${mesSeguinte.getFullYear()}-${mesSeguinte.getMonth() + 1}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <CircleDollarSign size={12} className="text-red-400" /> Cobrança vencendo
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-sky-400" /> Prazo de tarefa
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
            const eventos = eventosPorDia[chave] || [];
            const foraDoMes = d.getMonth() !== mes;
            const ehHoje = chave === hojeChave;

            return (
              <div
                key={chave}
                className={`min-h-[92px] border-b border-r border-border p-1.5 last:border-r-0 ${
                  foraDoMes ? "bg-black/20" : ""
                }`}
              >
                <span
                  className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    ehHoje ? "bg-accent text-white" : foraDoMes ? "text-muted/40" : "text-muted"
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-1">
                  {eventos.slice(0, 3).map((e, i) => (
                    <div
                      key={i}
                      className={`truncate rounded px-1 py-0.5 text-[10px] ${
                        e.tipo === "cobranca"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-sky-500/10 text-sky-400"
                      }`}
                      title={e.texto}
                    >
                      {e.texto}
                    </div>
                  ))}
                  {eventos.length > 3 && (
                    <p className="text-[10px] text-muted">+{eventos.length - 3} mais</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
