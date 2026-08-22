import { NextRequest, NextResponse } from "next/server";
import ical from "ical-generator";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.AGENDA_SECRET || secret !== process.env.AGENDA_SECRET) {
    return NextResponse.json({ erro: "Secret inválido" }, { status: 401 });
  }

  const [tarefas, cobrancas, registrosTempo] = await Promise.all([
    prisma.tarefa.findMany({
      where: { prazo: { not: null } },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.cobranca.findMany({
      where: { vencimento: { not: null } },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.registroTempo.findMany({
      where: { fim: { not: null } },
      include: { cliente: { select: { nome: true } } },
    }),
  ]);

  const calendario = ical({ name: "Instaby — Agenda" });

  tarefas.forEach((t) => {
    const semHorarioDefinido = t.prazo!.getHours() === 0 && t.prazo!.getMinutes() === 0;
    calendario.createEvent({
      start: t.prazo!,
      end: new Date(t.prazo!.getTime() + 30 * 60 * 1000),
      allDay: semHorarioDefinido,
      summary: t.cliente ? `${t.titulo} — ${t.cliente.nome}` : t.titulo,
      description: t.descricao || undefined,
      id: `tarefa-${t.id}`,
    });
  });

  cobrancas.forEach((c) => {
    calendario.createEvent({
      start: c.vencimento!,
      allDay: true,
      summary: `💰 Vence: ${c.cliente.nome} — R$ ${Number(c.valor).toFixed(0)}`,
      id: `cobranca-${c.id}`,
    });
  });

  registrosTempo.forEach((r) => {
    calendario.createEvent({
      start: r.inicio,
      end: r.fim!,
      summary: r.cliente ? `⏱ ${r.atividade} — ${r.cliente.nome}` : `⏱ ${r.atividade}`,
      id: `hora-${r.id}`,
    });
  });

  return new NextResponse(calendario.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="instaby-agenda.ics"',
    },
  });
}
