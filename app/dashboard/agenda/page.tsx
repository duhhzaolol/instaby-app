import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  CalendarCheck,
  Clock,
  Sun,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  AgendaGrid,
  type EventoAgenda,
} from "@/components/dashboard/AgendaGrid";
import { FiltroClienteAgenda } from "@/components/dashboard/FiltroClienteAgenda";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { StatTile } from "@/components/ui/StatTile";
import { formatarDuracao } from "@/lib/formatarDuracao";
import {
  TIPOS_ATIVIDADE_AGENDA,
  classificarTipoAtividade,
  tipoDaTarefaAgenda,
} from "@/lib/tipoAtividadeAgenda";
import { visualDaCategoriaTarefa } from "@/lib/categoriaTarefaVisual";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";
import { urgenciaPrazo } from "@/lib/urgenciaPrazo";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";
import { linkAgenda, periodoAgenda, type FiltrosAgenda } from "@/lib/agenda";

export const dynamic = "force-dynamic";
const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
function horaBR(d: Date) {
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Partial<FiltrosAgenda>;
}) {
  const hoje = new Date();
  const periodo = periodoAgenda(searchParams.mes, hoje);
  const clienteFiltro = searchParams.cliente || "";
  const soTarefas = searchParams.visao === "tarefas";
  const soPendentes = searchParams.status === "pendentes";
  const tiposAtivos = new Set(
    searchParams.tipos === undefined
      ? TIPOS_ATIVIDADE_AGENDA.map((t) => t.valor)
      : TIPOS_ATIVIDADE_AGENDA.filter((t) =>
          searchParams.tipos!.split(",").includes(t.valor),
        ).map((t) => t.valor),
  );
  const filtros: FiltrosAgenda = {
    mes: periodo.mesChave,
    cliente: clienteFiltro,
    tipos: Array.from(tiposAtivos).join(","),
    status: soPendentes ? "pendentes" : "todas",
    visao: soTarefas ? "tarefas" : "tudo",
  };

  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");
  const idsPermitidos = await clienteIdsPermitidos(usuarioAtual);
  // O cliente escolhido é somado às permissões; nunca substitui esse filtro.
  const filtroAcesso = idsPermitidos
    ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] }
    : {};
  const filtroCliente = clienteFiltro ? { clienteId: clienteFiltro } : {};
  const datas = { gte: periodo.inicioConsulta, lt: periodo.fimConsulta };
  const [tarefas, registrosTempo, clientes] = await Promise.all([
    prisma.tarefa.findMany({
      where: {
        prazo: datas,
        ...filtroAcesso,
        ...filtroCliente,
        ...(!usuarioAtual.master && { responsavelId: usuarioAtual.id }),
        ...(soPendentes && { status: { not: "feito" } }),
      },
      include: {
        cliente: { select: { id: true, nome: true, cor: true } },
        responsavel: { select: { nome: true, fotoUrl: true } },
      },
      orderBy: { prazo: "asc" },
    }),
    soTarefas
      ? Promise.resolve([])
      : prisma.registroTempo.findMany({
          where: {
            inicio: datas,
            ...filtroAcesso,
            ...filtroCliente,
            ...(!usuarioAtual.master && { usuarioId: usuarioAtual.id }),
          },
          include: {
            cliente: { select: { id: true, nome: true, cor: true } },
            usuario: { select: { nome: true, fotoUrl: true } },
          },
        }),
    prisma.cliente.findMany({
      where: idsPermitidos ? { id: { in: idsPermitidos } } : {},
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (clienteFiltro && !clientes.some((c) => c.id === clienteFiltro))
    notFound();

  const eventosPorDia: Record<string, EventoAgenda[]> = {};
  let totalTarefas = 0;
  let totalHoras = 0;
  for (const t of tarefas) {
    if (!t.prazo) continue;
    const tipoAtividade = tipoDaTarefaAgenda(
      t.categoria,
      t.titulo,
      !!t.cliente,
    );
    if (!tiposAtivos.has(tipoAtividade)) continue;
    const chave = chaveDiaSaoPaulo(t.prazo);
    if (chave.startsWith(periodo.mesChave)) totalTarefas++;
    (eventosPorDia[chave] ||= []).push({
      id: t.id,
      origem: "tarefa",
      tipoAtividade,
      texto: t.titulo,
      categoriaLabel: visualDaCategoriaTarefa(t.categoria).label,
      status: t.status,
      clienteNome: t.cliente?.nome || null,
      usuarioNome: t.responsavel?.nome || null,
      usuarioFotoUrl: t.responsavel?.fotoUrl || null,
      cor: t.cliente?.cor,
      href: linkAgenda(filtros, { tarefa: t.id }),
      data: chave,
      hora: horaBR(t.prazo) !== "00:00" ? horaBR(t.prazo) : null,
      urgencia: t.status !== "feito" ? urgenciaPrazo(t.prazo) : null,
    });
  }
  for (const r of registrosTempo) {
    const tipoAtividade = classificarTipoAtividade(r.atividade, !!r.cliente);
    if (!tiposAtivos.has(tipoAtividade)) continue;
    const chave = chaveDiaSaoPaulo(r.inicio);
    if (chave.startsWith(periodo.mesChave) && r.fim)
      totalHoras += Math.max(0, r.fim.getTime() - r.inicio.getTime()) / 3600000;
    (eventosPorDia[chave] ||= []).push({
      id: r.id,
      origem: "hora",
      tipoAtividade,
      texto: r.atividade,
      clienteNome: r.cliente?.nome || null,
      usuarioNome: r.usuario?.nome || null,
      usuarioFotoUrl: r.usuario?.fotoUrl || null,
      cor: r.cliente?.cor,
      href: r.cliente ? `/dashboard/horas/${r.cliente.id}` : "/dashboard/horas",
      data: chave,
      horaInicio: horaBR(r.inicio),
      horaFim: r.fim ? horaBR(r.fim) : null,
    });
  }
  Object.values(eventosPorDia).forEach((lista) =>
    lista.sort((a, b) =>
      (a.horaInicio || a.hora || "").localeCompare(
        b.horaInicio || b.hora || "",
      ),
    ),
  );
  const hojeChave = chaveDiaSaoPaulo(hoje);
  const eventosHoje = eventosPorDia[hojeChave]?.length || 0;
  const host = headers().get("host");
  const linkIcs =
    usuarioAtual.master && process.env.AGENDA_SECRET
      ? `https://${host}/api/agenda.ics?secret=${process.env.AGENDA_SECRET}`
      : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Agenda{" "}
            <AjudaContextual
              titulo="Agenda e cronograma"
              texto="Organize as tarefas por dia e cliente. Todos os clientes aparecem por padrão; use a lista para ver um deles. Clique na tarefa para abrir os detalhes, editar e comentar."
              exemplo="Selecione SKYFIT, escolha um dia e crie um Reel ou uma arte. O horário é opcional."
            />
          </p>
          <p className="text-sm text-muted">
            Cronograma de tarefas por cliente, com horário opcional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            aria-label="Mês anterior"
            href={linkAgenda(filtros, { mes: periodo.mesAnterior })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronLeft size={15} />
          </Link>
          <p className="w-36 text-center text-sm font-medium text-text">
            {NOMES_MESES[periodo.mes]} {periodo.ano}
          </p>
          <Link
            aria-label="Próximo mês"
            href={linkAgenda(filtros, { mes: periodo.mesSeguinte })}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FiltroClienteAgenda clientes={clientes} clienteAtual={clienteFiltro} />
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { visao: "tudo", label: "Tarefas e horas" },
            { visao: "tarefas", label: "Só tarefas" },
          ].map((v) => (
            <Link
              key={v.visao}
              href={linkAgenda(filtros, { visao: v.visao })}
              className={`rounded-lg border px-3 py-2 ${filtros.visao === v.visao ? "border-accent/40 bg-accent/10 text-text" : "border-border text-muted hover:text-text"}`}
            >
              {v.label}
            </Link>
          ))}
          <Link
            href={linkAgenda(filtros, {
              status: soPendentes ? "todas" : "pendentes",
            })}
            className="rounded-lg border border-border px-3 py-2 text-muted hover:text-text"
          >
            {soPendentes ? "Só tarefas pendentes" : "Todas as tarefas"}
          </Link>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile
          icone={<CalendarCheck size={12} style={{ color: "#3B82F6" }} />}
          label="Tarefas do mês"
          valor={totalTarefas}
          index={0}
        />
        <StatTile
          icone={<Clock size={12} style={{ color: "#0D9488" }} />}
          label="Horas registradas"
          valor={formatarDuracao(totalHoras)}
          index={1}
        />
        <StatTile
          icone={<Sun size={12} style={{ color: "#F59E0B" }} />}
          label="Hoje"
          valor={eventosHoje}
          sub={
            eventosHoje
              ? "itens nesta visualização"
              : "nenhum item nesta visualização"
          }
          index={2}
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {TIPOS_ATIVIDADE_AGENDA.map((tipo) => {
          const ativo = tiposAtivos.has(tipo.valor);
          const novos = new Set(tiposAtivos);
          ativo ? novos.delete(tipo.valor) : novos.add(tipo.valor);
          const Icon = tipo.icone;
          return (
            <Link
              key={tipo.valor}
              aria-label={`${ativo ? "Ocultar" : "Mostrar"} ${tipo.label}`}
              href={linkAgenda(filtros, { tipos: Array.from(novos).join(",") })}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${ativo ? "border-border bg-card/60 text-text" : "border-border/50 text-muted/50"}`}
            >
              <Icon size={11} style={{ color: ativo ? tipo.cor : undefined }} />
              {tipo.label}
            </Link>
          );
        })}
      </div>
      <p className="mb-3 text-xs text-muted">
        As tarefas aparecem na data escolhida para o trabalho. Você pode
        planejar só o dia; a sugestão de postagem e a publicação ficam nos
        detalhes do conteúdo.
      </p>
      <AgendaGrid
        dias={periodo.dias}
        eventosPorDia={eventosPorDia}
        mes={periodo.mes}
        hojeChave={hojeChave}
        clientes={clientes}
        clienteIdAtual={clienteFiltro}
      />
      <section
        aria-label="Calendários externos"
        className="mt-8 border-t border-border pt-5"
      >
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
          <CalendarPlus size={18} className="mt-0.5 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text">
              Ver no Google Agenda ou no Calendário da Apple
            </p>
            {linkIcs ? (
              <>
                <p className="mb-2 text-xs text-muted">
                  Adicione este link como assinatura de calendário. A assinatura
                  acompanha a agenda geral da agência e é atualizada pelo
                  serviço de calendário.
                </p>
                <code className="block truncate rounded-lg bg-base/60 px-3 py-2 text-[11px] text-muted">
                  {linkIcs}
                </code>
              </>
            ) : (
              <p className="text-xs text-muted">
                A conexão com calendários externos pode ser configurada pela
                administração da agência.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
