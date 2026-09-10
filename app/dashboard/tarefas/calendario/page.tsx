import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CalendarioTarefas, TarefaCalendario } from "@/components/dashboard/CalendarioTarefas";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function chaveDiaEvento(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function horaBR(d: Date) {
  const h = d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  return h !== "00:00" ? h : null;
}

export default async function CalendarioTarefasPage({
  searchParams,
}: {
  searchParams: { mes?: string; cliente?: string; status?: string };
}) {
  const hoje = new Date();
  const [anoParam, mesParam] = (searchParams.mes || `${hoje.getFullYear()}-${hoje.getMonth() + 1}`)
    .split("-")
    .map(Number);
  const ano = anoParam;
  const mes = mesParam - 1;
  const soPendentes = searchParams.status !== "todas";
  const clienteFiltro = searchParams.cliente || "";

  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);
  const inicioGrade = new Date(inicioMes);
  inicioGrade.setDate(inicioGrade.getDate() - inicioMes.getDay());
  const fimGrade = new Date(fimMes);
  fimGrade.setDate(fimGrade.getDate() + (6 - fimMes.getDay()));

  const mesAnterior = new Date(ano, mes - 1, 1);
  const mesSeguinte = new Date(ano, mes + 1, 1);
  const hojeChave = chaveDiaEvento(hoje);

  const [tarefas, clientes] = await Promise.all([
    prisma.tarefa.findMany({
      where: {
        prazo: { gte: inicioGrade, lte: fimGrade },
        ...(soPendentes && { status: { not: "feito" } }),
        ...(clienteFiltro && { clienteId: clienteFiltro }),
      },
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
      orderBy: { prazo: "asc" },
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const tarefasPorDia: Record<string, TarefaCalendario[]> = {};
  tarefas.forEach((t) => {
    if (!t.prazo) return;
    const chave = chaveDiaEvento(t.prazo);
    (tarefasPorDia[chave] ||= []).push({
      id: t.id,
      titulo: t.titulo,
      categoria: t.categoria,
      categoriaLabel: visualDaCategoriaTarefa(t.categoria).label,
      clienteId: t.cliente?.id || null,
      clienteNome: t.cliente?.nome || null,
      clienteCor: t.cliente?.cor || null,
      status: t.status,
      data: chave,
      hora: horaBR(t.prazo),
    });
  });

  const dias: string[] = [];
  for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
    dias.push(chaveDiaEvento(d));
  }

  const linkComFiltros = (extra: Record<string, string>) => {
    const params = new URLSearchParams({
      mes: `${ano}-${mes + 1}`,
      status: soPendentes ? "pendentes" : "todas",
      ...(clienteFiltro && { cliente: clienteFiltro }),
      ...extra,
    });
    return `/dashboard/tarefas/calendario?${params.toString()}`;
  };

  return (
    <div>
      <Link href="/dashboard/tarefas" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Tarefas
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-medium text-text">Calendário de conteúdo</p>
          <p className="text-sm text-muted">Cronograma de tarefas — bom pra apresentar pro cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={linkComFiltros({ mes: `${mesAnterior.getFullYear()}-${mesAnterior.getMonth() + 1}` })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronLeft size={15} />
          </Link>
          <p className="w-36 text-center text-sm font-medium text-text">
            {NOMES_MESES[mes]} {ano}
          </p>
          <Link
            href={linkComFiltros({ mes: `${mesSeguinte.getFullYear()}-${mesSeguinte.getMonth() + 1}` })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={linkComFiltros({ cliente: "" })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !clienteFiltro ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            Todos os clientes
          </Link>
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={linkComFiltros({ cliente: c.id })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                clienteFiltro === c.id ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
              }`}
            >
              {c.nome}
            </Link>
          ))}
        </div>
        <span className="mx-1 h-4 w-px bg-border" />
        <Link
          href={linkComFiltros({ status: soPendentes ? "todas" : "pendentes" })}
          className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
        >
          {soPendentes ? "Mostrando só pendentes" : "Mostrando todas"}
        </Link>
      </div>

      <CalendarioTarefas dias={dias} tarefasPorDia={tarefasPorDia} mes={mes} hojeChave={hojeChave} />
    </div>
  );
}
