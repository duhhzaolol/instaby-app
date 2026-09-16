import Link from "next/link";
import { headers } from "next/headers";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AgendaGrid, EventoAgenda } from "@/components/dashboard/AgendaGrid";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { TIPOS_ATIVIDADE_AGENDA, classificarTipoAtividade } from "@/lib/tipoAtividadeAgenda";

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function chaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Usado só pra encaixar um horário salvo (tarefa/hora) no dia certo do calendário,
// já considerando o fuso de Brasília — evita virar o dia seguinte perto da meia-noite.
function chaveDiaEvento(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function horaBR(d: Date) {
  return d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { mes?: string; tipos?: string };
}) {
  const hoje = new Date();
  const [anoParam, mesParam] = (searchParams.mes || `${hoje.getFullYear()}-${hoje.getMonth() + 1}`)
    .split("-")
    .map(Number);
  const ano = anoParam;
  const mes = mesParam - 1; // 0-indexed

  // Todos os tipos ativos por padrão — compromissos, serviços e horas trabalhadas juntos.
  const tiposAtivos = new Set(
    (searchParams.tipos || TIPOS_ATIVIDADE_AGENDA.map((t) => t.valor).join(",")).split(",")
  );

  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);
  const inicioGrade = new Date(inicioMes);
  inicioGrade.setDate(inicioGrade.getDate() - inicioMes.getDay());
  const fimGrade = new Date(fimMes);
  fimGrade.setDate(fimGrade.getDate() + (6 - fimMes.getDay()));

  const [tarefas, registrosTempo] = await Promise.all([
    prisma.tarefa.findMany({
      where: { prazo: { gte: inicioGrade, lte: fimGrade } },
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
    }),
    prisma.registroTempo.findMany({
      where: { inicio: { gte: inicioGrade, lte: fimGrade } },
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
    }),
  ]);

  const eventosPorDia: Record<string, EventoAgenda[]> = {};

  tarefas.forEach((t) => {
    if (!t.prazo) return;
    const tipoAtividade =
      t.categoria === "reuniao"
        ? "reuniao"
        : t.categoria === "gravacao"
        ? "captacao"
        : classificarTipoAtividade(t.titulo, !!t.cliente);
    if (!tiposAtivos.has(tipoAtividade)) return;
    const chave = chaveDiaEvento(t.prazo);
    (eventosPorDia[chave] ||= []).push({
      id: t.id,
      origem: "tarefa",
      tipoAtividade,
      texto: t.cliente ? `${t.titulo} · ${t.cliente.nome}` : t.titulo,
      clienteNome: t.cliente?.nome || null,
      cor: t.cliente?.cor,
      href: t.cliente ? `/dashboard/clientes/${t.cliente.id}?aba=tarefas` : "/dashboard",
      data: chave,
      hora: horaBR(t.prazo) !== "00:00" ? horaBR(t.prazo) : null,
    });
  });

  registrosTempo.forEach((r) => {
    const tipoAtividade = classificarTipoAtividade(r.atividade, !!r.cliente);
    if (!tiposAtivos.has(tipoAtividade)) return;
    const chave = chaveDiaEvento(r.inicio);
    (eventosPorDia[chave] ||= []).push({
      id: r.id,
      origem: "hora",
      tipoAtividade,
      texto: r.cliente ? `${r.atividade} · ${r.cliente.nome}` : r.atividade,
      clienteNome: r.cliente?.nome || null,
      cor: r.cliente?.cor,
      href: r.cliente ? `/dashboard/horas/${r.cliente.id}` : "/dashboard/horas",
      data: chave,
      horaInicio: horaBR(r.inicio),
      horaFim: r.fim ? horaBR(r.fim) : null,
    });
  });

  // Ordena cada dia por horário (horaInicio ou hora), pra ficar tipo "09:00 – Edição – Cliente"
  Object.values(eventosPorDia).forEach((lista) =>
    lista.sort((a, b) => (a.horaInicio || a.hora || "").localeCompare(b.horaInicio || b.hora || ""))
  );

  const dias: string[] = [];
  for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
    dias.push(chaveDia(d));
  }

  const mesAnterior = new Date(ano, mes - 1, 1);
  const mesSeguinte = new Date(ano, mes + 1, 1);
  const hojeChave = chaveDiaEvento(hoje);

  const host = headers().get("host");
  const linkIcs = process.env.AGENDA_SECRET
    ? `https://${host}/api/agenda.ics?secret=${process.env.AGENDA_SECRET}`
    : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Agenda
            <AjudaContextual
              titulo="Agenda"
              texto="Mostra compromissos, serviços (captação, edição, reunião) e horas trabalhadas — tudo com horário, atividade e cliente. Informações financeiras ficam só no Financeiro."
              exemplo="Ex.: 09:00 – Edição – Dr. Lauro. Clique no dia pra ver tudo daquele dia, ou num item pra editar."
            />
          </p>
          <p className="text-sm text-muted">Compromissos, serviços e horas trabalhadas num só lugar</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/agenda?mes=${mesAnterior.getFullYear()}-${mesAnterior.getMonth() + 1}&tipos=${Array.from(tiposAtivos).join(",")}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronLeft size={15} />
          </Link>
          <p className="w-36 text-center text-sm font-medium text-text">
            {NOMES_MESES[mes]} {ano}
          </p>
          <Link
            href={`/dashboard/agenda?mes=${mesSeguinte.getFullYear()}-${mesSeguinte.getMonth() + 1}&tipos=${Array.from(tiposAtivos).join(",")}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {linkIcs ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <CalendarPlus size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text">Ver no Google Agenda ou no Calendário da Apple</p>
            <p className="mb-2 text-xs text-muted">
              Copia esse link e cola em "Adicionar calendário → A partir de URL" (Google) ou "Nova assinatura de
              calendário" (Apple). Atualiza sozinho de tempos em tempos.
            </p>
            <code className="block truncate rounded-lg bg-base/60 px-3 py-2 text-[11px] text-muted">{linkIcs}</code>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-xs text-muted">
          Pra sincronizar com Google/Apple Calendar, configure a variável <code>AGENDA_SECRET</code> no ambiente.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {TIPOS_ATIVIDADE_AGENDA.map((tipo) => {
          const ativo = tiposAtivos.has(tipo.valor);
          const novosTipos = new Set(tiposAtivos);
          ativo ? novosTipos.delete(tipo.valor) : novosTipos.add(tipo.valor);
          const Icon = tipo.icone;
          return (
            <Link
              key={tipo.valor}
              href={`/dashboard/agenda?mes=${ano}-${mes + 1}&tipos=${Array.from(novosTipos).join(",")}`}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                ativo ? "border-border bg-card/60 text-text" : "border-border/50 text-muted/50"
              }`}
            >
              <Icon size={11} style={{ color: ativo ? tipo.cor : undefined }} /> {tipo.label}
            </Link>
          );
        })}
      </div>

      <AgendaGrid dias={dias} eventosPorDia={eventosPorDia} mes={mes} hojeChave={hojeChave} />
    </div>
  );
}
