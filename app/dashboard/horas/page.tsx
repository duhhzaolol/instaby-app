import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NovoRegistroTempoForm } from "@/components/dashboard/NovoRegistroTempoForm";
import { RegistroTempoRow } from "@/components/dashboard/RegistroTempoRow";
import { formatarDuracao } from "@/lib/formatarDuracao";

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
      include: { cliente: { select: { id: true, nome: true, cor: true } } },
      orderBy: { inicio: "desc" },
    }),
    prisma.tarefa.findMany({
      where: { status: { not: "feito" } },
      select: { id: true, titulo: true, clienteId: true },
    }),
  ]);

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

  return (
    <div>
      <p className="mb-1 text-lg font-medium text-text">Horas</p>
      <p className="mb-6 text-sm text-muted">Dado interno — o cliente nunca vê isso</p>

      <NovoRegistroTempoForm clientes={clientes} tarefasAbertas={tarefasAbertas} />

      <div className="mb-6 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
        <span className="text-sm font-medium text-text">Total do mês (todos os clientes)</span>
        <span className="text-xl font-medium text-accent">{formatarDuracao(totalMes)}</span>
      </div>

      {ranking.length === 0 && semCliente.length === 0 ? (
        <p className="mb-6 text-sm text-muted">Nada registrado ainda esse mês.</p>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ranking.map(([nome, bloco]) => {
            const cor = bloco.cor || "#E63946";
            const atividades = Object.entries(bloco.atividades).sort((a, b) => b[1] - a[1]);
            const maiorAtividade = Math.max(...atividades.map(([, h]) => h));

            return (
              <Link
                key={nome}
                href={`/dashboard/horas/${bloco.id}`}
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
      )}

      {semCliente.length > 0 && (
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
                }}
              />
            ))}
          </div>
        </div>
      )}

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
            }}
          />
        ))}
      </div>
    </div>
  );
}
