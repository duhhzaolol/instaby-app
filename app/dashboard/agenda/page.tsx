import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  AgendaGrid,
  type EventoAgenda,
} from "@/components/dashboard/AgendaGrid";
import { FiltroClienteAgenda } from "@/components/dashboard/FiltroClienteAgenda";
import { AgendaLista } from "@/components/dashboard/AgendaLista";
import { ResumoMensalAgenda } from "@/components/dashboard/ResumoMensalAgenda";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
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
import {
  dataDaAgenda,
  etapaDaTarefa,
  type BaseDataAgenda,
} from "@/lib/cronogramaAgenda";

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
  const emLista = searchParams.formato === "lista";
  const baseData: BaseDataAgenda =
    searchParams.datas === "postagem" || searchParams.datas === "publicado"
      ? searchParams.datas
      : "trabalho";
  const soPendentes =
    baseData !== "publicado" && searchParams.status === "pendentes";
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
    formato: emLista ? "lista" : "calendario",
    datas: baseData,
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
        AND: [
          filtroAcesso,
          filtroCliente,
          {
            OR: [
              { prazo: datas },
              { publicacaoSugeridaEm: datas },
              { statusConteudo: "publicado", publicadoEm: datas },
            ],
          },
        ],
        ...(!usuarioAtual.master && { responsavelId: usuarioAtual.id }),
      },
      include: {
        cliente: { select: { id: true, nome: true, cor: true } },
        responsavel: { select: { nome: true, fotoUrl: true } },
        versoes: {
          orderBy: { numero: "desc" },
          take: 1,
          select: { aprovadoEm: true, alteracoesSolicitadasEm: true },
        },
      },
      orderBy: { prazo: "asc" },
    }),
    soTarefas || baseData !== "trabalho"
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
    const dataEscolhida = dataDaAgenda(t, baseData);
    if (!dataEscolhida || (soPendentes && t.status === "feito")) continue;
    const tipoAtividade = tipoDaTarefaAgenda(
      t.categoria,
      t.titulo,
      !!t.cliente,
    );
    if (!tiposAtivos.has(tipoAtividade)) continue;
    const chave = chaveDiaSaoPaulo(new Date(dataEscolhida));
    if (!periodo.dias.includes(chave)) continue;
    if (chave.startsWith(periodo.mesChave)) totalTarefas++;
    (eventosPorDia[chave] ||= []).push({
      id: t.id,
      origem: "tarefa",
      tipoAtividade,
      texto: t.titulo,
      categoriaLabel: visualDaCategoriaTarefa(t.categoria).label,
      status: t.status,
      etapa: etapaDaTarefa(t),
      tipoData: baseData,
      prazo: t.prazo?.toISOString() || null,
      postagemPlanejada: t.publicacaoSugeridaEm?.toISOString() || null,
      publicadoEm:
        t.statusConteudo === "publicado"
          ? t.publicadoEm?.toISOString() || null
          : null,
      linkPublicacao: t.linkPublicacao,
      clienteNome: t.cliente?.nome || null,
      usuarioNome: t.responsavel?.nome || null,
      usuarioFotoUrl: t.responsavel?.fotoUrl || null,
      cor: t.cliente?.cor,
      href: linkAgenda(filtros, { tarefa: t.id }),
      data: chave,
      hora:
        horaBR(new Date(dataEscolhida)) !== "00:00"
          ? horaBR(new Date(dataEscolhida))
          : null,
      urgencia:
        baseData === "trabalho" && t.status !== "feito" && t.prazo
          ? urgenciaPrazo(t.prazo)
          : null,
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
            Produção, postagens e resultados do mês por cliente
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
          {baseData === "trabalho" &&
            [
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
          {baseData !== "publicado" && (
            <Link
              href={linkAgenda(filtros, {
                status: soPendentes ? "todas" : "pendentes",
              })}
              className="rounded-lg border border-border px-3 py-2 text-muted hover:text-text"
            >
              {soPendentes ? "Só tarefas pendentes" : "Todas as tarefas"}
            </Link>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-1.5 text-xs"
          aria-label="Escolher data do cronograma"
        >
          {[
            { valor: "trabalho", label: "Prazos de produção" },
            { valor: "postagem", label: "Postagens planejadas" },
            { valor: "publicado", label: "Publicados" },
          ].map((d) => (
            <Link
              key={d.valor}
              aria-current={baseData === d.valor ? "page" : undefined}
              href={linkAgenda(filtros, { datas: d.valor })}
              className={`rounded-lg border px-3 py-2 ${baseData === d.valor ? "border-accent/40 bg-accent/10 text-text" : "border-border text-muted hover:text-text"}`}
            >
              {d.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-1.5 text-xs" aria-label="Formato da agenda">
          {[
            { valor: "calendario", label: "Calendário" },
            { valor: "lista", label: "Lista do mês" },
          ].map((f) => (
            <Link
              key={f.valor}
              aria-current={filtros.formato === f.valor ? "page" : undefined}
              href={linkAgenda(filtros, { formato: f.valor })}
              className={`rounded-lg border px-3 py-2 ${filtros.formato === f.valor ? "border-accent/40 bg-accent/10 text-text" : "border-border text-muted hover:text-text"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>
      <div
        className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"
        aria-label="Totais da visualização"
      >
        <span>
          <strong className="text-text">{totalTarefas}</strong>{" "}
          {baseData === "trabalho" ? "tarefas" : "conteúdos"} nesta visualização
        </span>
        {baseData === "trabalho" && !soTarefas && (
          <span>{formatarDuracao(totalHoras)} registradas no mês</span>
        )}
        <span>{eventosHoje} itens hoje nesta visualização</span>
      </div>
      <ResumoMensalAgenda
        tarefas={tarefas}
        mesChave={periodo.mesChave}
        clienteNome={clientes.find((c) => c.id === clienteFiltro)?.nome}
        filtros={filtros}
      />
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
        {baseData === "trabalho"
          ? "Aqui aparece o prazo para terminar o trabalho. O dia de postagem é separado e pode ser definido nos detalhes."
          : baseData === "postagem"
            ? "Aqui aparecem somente os dias de postagem que você planejou. O prazo de produção permanece separado; o horário é opcional."
            : "Aqui aparecem conteúdos marcados como publicados na data registrada de publicação. Concluir a tarefa não significa publicar."}
      </p>
      {emLista ? (
        <AgendaLista
          eventos={Object.values(eventosPorDia).flat()}
          mesChave={periodo.mesChave}
          clientes={clientes}
          clienteIdAtual={clienteFiltro}
          baseData={baseData === "trabalho" ? "trabalho" : "postagem"}
        />
      ) : (
        <AgendaGrid
          dias={periodo.dias}
          eventosPorDia={eventosPorDia}
          mes={periodo.mes}
          hojeChave={hojeChave}
          clientes={clientes}
          clienteIdAtual={clienteFiltro}
          baseData={baseData === "trabalho" ? "trabalho" : "postagem"}
        />
      )}
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
