import { prisma } from "@/lib/prisma";
import { NovoRegistroTempoForm } from "@/components/dashboard/NovoRegistroTempoForm";
import { RegistroTempoRow } from "@/components/dashboard/RegistroTempoRow";

function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inicioHoje() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function HorasPage() {
  const [clientes, registrosHoje, registrosMes, tarefasAbertas] = await Promise.all([
    prisma.cliente.findMany({
      where: { status: { not: "inativo" } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.registroTempo.findMany({
      where: { inicio: { gte: inicioHoje() } },
      include: { cliente: { select: { nome: true } } },
      orderBy: { inicio: "desc" },
    }),
    prisma.registroTempo.findMany({
      where: { inicio: { gte: inicioMes() } },
      include: { cliente: { select: { nome: true } } },
    }),
    prisma.tarefa.findMany({
      where: { status: { not: "feito" } },
      select: { id: true, titulo: true, clienteId: true },
    }),
  ]);

  const porCliente: Record<string, number> = {};
  let semCliente = 0;
  let totalMes = 0;

  registrosMes.forEach((r) => {
    if (!r.fim) return;
    const horas = (r.fim.getTime() - r.inicio.getTime()) / 1000 / 60 / 60;
    totalMes += horas;
    if (r.cliente) {
      porCliente[r.cliente.nome] = (porCliente[r.cliente.nome] || 0) + horas;
    } else {
      semCliente += horas;
    }
  });

  const ranking = Object.entries(porCliente).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <p className="mb-1 text-lg font-medium text-text">Horas</p>
      <p className="mb-6 text-sm text-muted">Dado interno — o cliente nunca vê isso</p>

      <NovoRegistroTempoForm clientes={clientes} tarefasAbertas={tarefasAbertas} />

      <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted">Este mês, por cliente</p>
        {ranking.length === 0 && semCliente === 0 ? (
          <p className="text-sm text-muted">Nada registrado ainda esse mês.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ranking.map(([nome, horas]) => (
              <div key={nome} className="flex items-center justify-between">
                <span className="text-sm text-text">{nome}</span>
                <span className="text-sm font-medium text-accent">{horas.toFixed(1)}h</span>
              </div>
            ))}
            {semCliente > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Sem cliente / interno</span>
                <span className="text-sm text-muted">{semCliente.toFixed(1)}h</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-text">Total</span>
              <span className="text-sm font-medium text-text">{totalMes.toFixed(1)}h</span>
            </div>
          </div>
        )}
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Hoje</p>
      <div className="flex flex-col gap-2">
        {registrosHoje.length === 0 && <p className="text-sm text-muted">Nada registrado hoje ainda.</p>}
        {registrosHoje.map((r, i) => (
          <RegistroTempoRow
            key={r.id}
            index={i}
            registro={{
              id: r.id,
              atividade: r.atividade,
              inicio: r.inicio.toISOString(),
              fim: r.fim?.toISOString() || null,
              clienteNome: r.cliente?.nome || null,
            }}
          />
        ))}
      </div>
    </div>
  );
}
