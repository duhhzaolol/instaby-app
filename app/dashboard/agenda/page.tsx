import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ChevronLeft, ChevronRight, CalendarPlus, CalendarCheck, Clock, Sun } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AgendaGrid, EventoAgenda } from "@/components/dashboard/AgendaGrid";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { StatTile } from "@/components/ui/StatTile";
import { formatarDuracao } from "@/lib/formatarDuracao";
import { TIPOS_ATIVIDADE_AGENDA, classificarTipoAtividade } from "@/lib/tipoAtividadeAgenda";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";
import { urgenciaPrazo } from "@/lib/urgenciaPrazo";
import { chaveDiaSaoPaulo } from "@/lib/dataHora";

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
  return chaveDiaSaoPaulo(d);
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
  const mesHoje = chaveDiaSaoPaulo(hoje).slice(0, 7);
  const [anoParam, mesParam] = (searchParams.mes || mesHoje)
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

  // Sem isso, um cookie de sessão ainda válido de alguém desativado (usuario.ativo=
  // false — o middleware não reconfere isso, só se o cookie existe) caía aqui com
  // usuarioAtual=null, e os filtros "só o meu" viravam `{}` (SEM filtro nenhum) em
  // vez de "nada" — mostraria a agenda inteira da agência, o oposto do pedido.
  // Auditoria v147: mesma proteção que app/dashboard/layout.tsx ganhou, e que
  // /dashboard/clientes e /dashboard/horas/[clienteId] já tinham.
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");

  const idsPermitidos = await clienteIdsPermitidos(usuarioAtual);
  // Igual em Tarefas/Horas: quem não tem "todos os clientes" só vê itens sem cliente
  // (internos) ou dos clientes liberados pra ele — nunca a agenda inteira da agência.
  const filtroCliente = idsPermitidos
    ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] }
    : {};
  // Só o dono vê a agenda da agência inteira — editor/tráfego (e qualquer outro
  // papel não-master) veem só o que é deles: tarefa da qual são responsáveis e
  // hora que eles mesmos lançaram (pedido explícito: "não a agência inteira").
  const verTudo = usuarioAtual.master;
  const filtroPessoalTarefa = verTudo ? {} : { responsavelId: usuarioAtual.id };
  const filtroPessoalHora = verTudo ? {} : { usuarioId: usuarioAtual.id };

  const [tarefas, registrosTempo] = await Promise.all([
    prisma.tarefa.findMany({
      where: { prazo: { gte: inicioGrade, lte: fimGrade }, ...filtroCliente, ...filtroPessoalTarefa },
      include: {
        cliente: { select: { id: true, nome: true, cor: true } },
        responsavel: { select: { nome: true, fotoUrl: true } },
      },
    }),
    prisma.registroTempo.findMany({
      where: { inicio: { gte: inicioGrade, lte: fimGrade }, ...filtroCliente, ...filtroPessoalHora },
      include: {
        cliente: { select: { id: true, nome: true, cor: true } },
        usuario: { select: { nome: true, fotoUrl: true } },
      },
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
    // Destaque de prazo vencido/vencendo — mesma régua do resto do app (Tarefas,
    // Kanban), e só faz sentido pra quem ainda não terminou (tarefa já feita não
    // precisa de alarme vermelho de atraso).
    const urgencia = t.status !== "feito" ? urgenciaPrazo(t.prazo) : null;
    (eventosPorDia[chave] ||= []).push({
      id: t.id,
      origem: "tarefa",
      tipoAtividade,
      texto: t.cliente ? `${t.titulo} · ${t.cliente.nome}` : t.titulo,
      clienteNome: t.cliente?.nome || null,
      usuarioNome: t.responsavel?.nome || null,
      usuarioFotoUrl: t.responsavel?.fotoUrl || null,
      cor: t.cliente?.cor,
      // Abre o painel lateral de detalhes (Etapa 1 v152) direto na Agenda, sem
      // navegar pra outra página — preserva mês/filtros atuais na URL.
      href: `/dashboard/agenda?mes=${ano}-${mes + 1}&tipos=${Array.from(tiposAtivos).join(",")}&tarefa=${t.id}`,
      data: chave,
      hora: horaBR(t.prazo) !== "00:00" ? horaBR(t.prazo) : null,
      urgencia,
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
      usuarioNome: r.usuario?.nome || null,
      usuarioFotoUrl: r.usuario?.fotoUrl || null,
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

  // Resumo do período — a partir dos mesmos dados já buscados acima, sem query nova.
  // Compromissos/horas contam o período inteiro (não só os tipos com filtro ligado),
  // pra servir de totalizador estável mesmo quando alguém desliga um tipo na grade.
  const totalCompromissos = tarefas.filter((t) => !!t.prazo).length;
  const totalHorasPeriodo = registrosTempo.reduce((s, r) => {
    if (!r.fim) return s;
    return s + (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 / 60;
  }, 0);
  const eventosHoje = eventosPorDia[hojeChave]?.length || 0;

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

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile
          icone={<CalendarCheck size={12} style={{ color: "#3B82F6" }} />}
          label="Compromissos no período"
          valor={totalCompromissos}
          index={0}
        />
        <StatTile
          icone={<Clock size={12} style={{ color: "#0D9488" }} />}
          label="Horas lançadas"
          valor={formatarDuracao(totalHorasPeriodo)}
          index={1}
        />
        <StatTile
          icone={<Sun size={12} style={{ color: "#F59E0B" }} />}
          label="Hoje"
          valor={eventosHoje}
          sub={eventosHoje === 0 ? "nada por enquanto" : eventosHoje === 1 ? "1 item na agenda" : "itens na agenda"}
          index={2}
        />
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
