import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NovoRegistroTempoForm } from "@/components/dashboard/NovoRegistroTempoForm";
import { RegistroTempoRow } from "@/components/dashboard/RegistroTempoRow";
import { CalendarioHoras } from "@/components/dashboard/CalendarioHoras";
import { formatarDuracao } from "@/lib/formatarDuracao";
import { AjudaContextual } from "@/components/ui/AjudaContextual";

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// "Hoje" no fuso de Brasília, não no fuso do servidor (Vercel roda em UTC) — sem isso,
// depois das 21h (horário de Brasília) o servidor já está no dia seguinte em UTC, e a
// tela mostrava a data errada como "hoje" (mesma classe de bug já corrigida na Agenda).
function hojeChaveBR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function inicioHoje() {
  return new Date(`${hojeChaveBR()}T00:00:00-03:00`);
}

function chaveDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Pra agrupar um registro (com horário real) no dia certo do calendário, considerando
// o fuso de Brasília — evita cair no dia seguinte perto da meia-noite.
function chaveDiaEvento(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export default async function HorasPage({
  searchParams,
}: {
  searchParams: { mes?: string; cliente?: string };
}) {
  const hojeChave = hojeChaveBR();
  const [anoHoje, mesHojeNum] = hojeChave.split("-").map(Number);
  const [anoParam, mesParam] = (searchParams.mes || `${anoHoje}-${mesHojeNum}`)
    .split("-")
    .map(Number);
  const ano = anoParam;
  const mes = mesParam - 1;
  const vendoMesAtual = ano === anoHoje && mes === mesHojeNum - 1;
  const clienteFiltro = searchParams.cliente || "";

  const inicioMesVisto = new Date(ano, mes, 1);
  const fimMesVisto = new Date(ano, mes + 1, 0, 23, 59, 59);
  const mesAnterior = new Date(ano, mes - 1, 1);
  const mesSeguinte = new Date(ano, mes + 1, 1);

  const inicioGrade = new Date(inicioMesVisto);
  inicioGrade.setDate(inicioGrade.getDate() - inicioMesVisto.getDay());
  const fimGrade = new Date(fimMesVisto);
  fimGrade.setDate(fimGrade.getDate() + (6 - fimMesVisto.getDay()));

  const [clientes, registrosHoje, registrosGrade, tarefasAbertas] = await Promise.all([
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    vendoMesAtual
      ? prisma.registroTempo.findMany({
          where: { inicio: { gte: inicioHoje() } },
          include: { cliente: { select: { nome: true, cor: true } } },
          orderBy: { inicio: "desc" },
        })
      : Promise.resolve([]),
    prisma.registroTempo.findMany({
      where: { inicio: { gte: inicioGrade, lte: fimGrade } },
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
      orderBy: { inicio: "desc" },
    }),
    prisma.tarefa.findMany({
      where: { status: { not: "feito" } },
      select: { id: true, titulo: true, clienteId: true },
    }),
  ]);

  const registrosMes = registrosGrade.filter((r) => r.inicio >= inicioMesVisto && r.inicio <= fimMesVisto);

  type BlocoCliente = { id: string; cor: string | null; total: number; atividades: Record<string, number> };
  const porCliente: Record<string, BlocoCliente> = {};
  const semCliente: typeof registrosMes = [];
  let totalMes = 0;

  registrosMes.forEach((r) => {
    if (!r.fim) return;
    const horas = (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 / 60;
    totalMes += horas;

    if (r.cliente) {
      const bloco = (porCliente[r.cliente.nome] ||= { id: r.cliente.id, cor: r.cliente.cor, total: 0, atividades: {} });
      bloco.total += horas;
      bloco.atividades[r.atividade] = (bloco.atividades[r.atividade] || 0) + horas;
    } else {
      semCliente.push(r);
    }
  });

  const totalSemCliente = semCliente.reduce((soma, r) => {
    if (!r.fim) return soma;
    return soma + (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 / 60;
  }, 0);

  const ranking = Object.entries(porCliente).sort((a, b) => b[1].total - a[1].total);

  // Calendário — geral (todos misturados) ou filtrado por um cliente só, sem sair da página
  const registrosCalendario = clienteFiltro ? registrosGrade.filter((r) => r.clienteId === clienteFiltro) : registrosGrade;
  const clienteSelecionado = clientes.find((c) => c.id === clienteFiltro);

  const porDia: Record<string, { horas: number; cor: string | null }> = {};
  const registrosDetalhadosPorDia: Record<
    string,
    {
      id: string;
      atividade: string;
      inicio: string;
      fim: string | null;
      clienteId: string | null;
      clienteNome: string | null;
      clienteCor: string | null;
    }[]
  > = {};
  registrosCalendario.forEach((r) => {
    const chave = chaveDiaEvento(r.inicio);
    (registrosDetalhadosPorDia[chave] ||= []).push({
      id: r.id,
      atividade: r.atividade,
      inicio: r.inicio.toISOString(),
      fim: r.fim?.toISOString() || null,
      clienteId: r.clienteId,
      clienteNome: r.cliente?.nome || null,
      clienteCor: r.cliente?.cor || null,
    });
    if (!r.fim) return;
    const horas = (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 / 60;
    const bloco = (porDia[chave] ||= { horas: 0, cor: r.cliente?.cor || null });
    bloco.horas += horas;
  });

  const diasGrade: Date[] = [];
  for (let d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) diasGrade.push(new Date(d));

  const linkComFiltro = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ mes: `${ano}-${mes + 1}`, ...(clienteFiltro && { cliente: clienteFiltro }), ...extra });
    return `/dashboard/horas?${params.toString()}`;
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-lg font-medium text-text">
          Horas
          <AjudaContextual
            titulo="Horas"
            texto="Registre o tempo trabalhado por atividade e cliente. O calendário mostra até 3 atividades por dia — clique no dia pra ver todas. Use os filtros de cliente pra ver só um projeto."
            exemplo="Ex.: clique num cliente na lista de filtros pra ver só as horas dele, sem sair da página."
          />
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={linkComFiltro({ mes: `${mesAnterior.getFullYear()}-${mesAnterior.getMonth() + 1}` })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronLeft size={14} />
          </Link>
          <p className="w-32 text-center text-sm font-medium text-text">
            {NOMES_MESES[mes]} {ano}
          </p>
          <Link
            href={linkComFiltro({ mes: `${mesSeguinte.getFullYear()}-${mesSeguinte.getMonth() + 1}` })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/60 text-muted hover:text-text"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted">Dado interno — o cliente nunca vê isso</p>

      <NovoRegistroTempoForm clientes={clientes} tarefasAbertas={tarefasAbertas} />

      <div className="mb-6 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
        <span className="text-sm font-medium text-text">
          Total {vendoMesAtual ? "do mês" : `de ${NOMES_MESES[mes].toLowerCase()}`} (todos os clientes)
        </span>
        <span className="text-xl font-medium text-accent">{formatarDuracao(totalMes)}</span>
      </div>

      {/* Filtro por cliente — clica pra trocar o calendário, sem sair da tela */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Link
          href={linkComFiltro({ cliente: "" })}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            !clienteFiltro ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
          }`}
        >
          Todos
        </Link>
        {clientes.map((c) => (
          <Link
            key={c.id}
            href={linkComFiltro({ cliente: c.id })}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              clienteFiltro === c.id ? "bg-accent text-white" : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.cor || "#9CA3AF" }} />
            {c.nome}
          </Link>
        ))}
      </div>

      <CalendarioHoras
        dias={diasGrade.map((d) => chaveDia(d))}
        registrosPorDia={registrosDetalhadosPorDia}
        totaisPorDia={porDia}
        mes={mes}
        hojeChave={hojeChave}
        clientes={clientes}
        corPadrao={clienteSelecionado?.cor}
      />

      {clienteFiltro && ranking.find(([, b]) => b.id === clienteFiltro) && (
        <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4">
          {(() => {
            const [, bloco] = ranking.find(([, b]) => b.id === clienteFiltro)!;
            const atividades = Object.entries(bloco.atividades).sort((a, b) => b[1] - a[1]);
            const maior = Math.max(...atividades.map(([, h]) => h));
            return (
              <>
                <p className="mb-3 text-sm font-medium text-text">Atividades de {clienteSelecionado?.nome}</p>
                <div className="flex flex-col gap-2">
                  {atividades.map(([atividade, horas]) => (
                    <div key={atividade}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted">{atividade}</span>
                        <span className="text-text">{formatarDuracao(horas)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-base">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(horas / maior) * 100}%`, backgroundColor: clienteSelecionado?.cor || "#E63946" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!clienteFiltro && (ranking.length === 0 && semCliente.length === 0 ? (
        <p className="mb-6 text-sm text-muted">Nada registrado nesse mês.</p>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ranking.map(([nome, bloco]) => {
            const cor = bloco.cor || "#E63946";
            const atividades = Object.entries(bloco.atividades).sort((a, b) => b[1] - a[1]);
            const maiorAtividade = Math.max(...atividades.map(([, h]) => h));

            return (
              <Link
                key={nome}
                href={linkComFiltro({ cliente: bloco.id })}
                className="block rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:bg-hover"
                style={{ borderLeft: `3px solid ${cor}` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-medium text-text">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} />
                    {nome}
                  </p>
                  <span className="text-sm font-medium text-text">{formatarDuracao(bloco.total)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {atividades.map(([atividade, horas]) => (
                    <div key={atividade}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted">{atividade}</span>
                        <span className="text-text">{formatarDuracao(horas)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-base">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(horas / maiorAtividade) * 100}%`, backgroundColor: cor }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      ))}

      {!clienteFiltro && semCliente.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted">Sem cliente / interno</p>
            <span className="text-xs text-muted">{formatarDuracao(totalSemCliente)}</span>
          </div>
          <p className="mb-2 text-xs text-muted">
            Registros sem cliente vinculado — clica no lápis pra atribuir um cliente depois de cadastrá-lo.
          </p>
          <div className="flex flex-col gap-2">
            {semCliente.map((r, i) => (
              <RegistroTempoRow
                key={r.id}
                index={i}
                clientes={clientes}
                registro={{
                  id: r.id,
                  atividade: r.atividade,
                  inicio: r.inicio.toISOString(),
                  fim: r.fim?.toISOString() || null,
                  clienteId: null,
                  clienteNome: null,
                  clienteCor: null,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {vendoMesAtual && !clienteFiltro && (
        <>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">Hoje</p>
          <div className="flex flex-col gap-2">
            {registrosHoje.length === 0 && <p className="text-sm text-muted">Nada registrado hoje ainda.</p>}
            {registrosHoje.map((r, i) => (
              <RegistroTempoRow
                key={r.id}
                index={i}
                clientes={clientes}
                registro={{
                  id: r.id,
                  atividade: r.atividade,
                  inicio: r.inicio.toISOString(),
                  fim: r.fim?.toISOString() || null,
                  clienteId: r.clienteId,
                  clienteNome: r.cliente?.nome || null,
                  clienteCor: r.cliente?.cor || null,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
