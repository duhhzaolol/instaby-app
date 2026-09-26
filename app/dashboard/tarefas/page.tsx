import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { NovaTarefaGlobalForm } from "@/components/dashboard/NovaTarefaGlobalForm";
import { CheckSquare, CalendarDays } from "lucide-react";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";

const ABAS = [
  { valor: "abertas", label: "Abertas" },
  { valor: "feito", label: "Concluídas" },
  { valor: "todas", label: "Todas" },
];

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filtro = searchParams.status || "abertas";

  const usuarioAtual = await getUsuarioAtual();
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  // Tarefa sem cliente (interna/geral) continua visível pra todo mundo — só
  // restringe a que é de um cliente específico fora da lista permitida.
  const filtroCliente = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};

  const where =
    filtro === "feito"
      ? { status: "feito", ...filtroCliente }
      : filtro === "todas"
      ? { ...filtroCliente }
      : { status: { not: "feito" }, ...filtroCliente };

  const [tarefas, clientes] = await Promise.all([
    prisma.tarefa.findMany({
      where,
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" }, ...(idsPermitidos ? { id: { in: idsPermitidos } } : {}) },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Tarefas
            <AjudaContextual
              titulo="Tarefas"
              texto="Lista todas as tarefas de todos os clientes. Crie uma tarefa rápida pela Visão Geral ou aqui mesmo. Tarefas com data/horário aparecem também na Agenda."
              exemplo="Ex.: filtre por 'Abertas' pra ver só o que ainda precisa ser feito."
            />
          </p>
          <p className="text-sm text-muted">Todas as tarefas, de todos os clientes, num lugar só</p>
        </div>
        <Link
          href="/dashboard/tarefas/calendario"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-text hover:bg-hover"
        >
          <CalendarDays size={14} /> Calendário de tarefas
        </Link>
      </div>

      <div className="mb-5 flex gap-2">
        {ABAS.map((a) => (
          <a
            key={a.valor}
            href={`/dashboard/tarefas?status=${a.valor}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === a.valor
                ? "bg-accent text-white"
                : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            {a.label}
          </a>
        ))}
      </div>

      <NovaTarefaGlobalForm clientes={clientes} />

      {tarefas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 py-16 text-center">
          <CheckSquare size={28} className="mb-3 text-muted" />
          <p className="text-sm text-muted">Nenhuma tarefa aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tarefas.map((t, i) => (
            <TarefaRow
              key={t.id}
              index={i}
              clienteNome={t.cliente?.nome || null}
              clienteCor={t.cliente?.cor || null}
              tarefa={{
                id: t.id,
                titulo: t.titulo,
                tipo: t.tipo,
                status: t.status,
                prazo: t.prazo?.toISOString() || null,
                categoria: t.categoria,
                descricao: t.descricao,
                prioridade: t.prioridade,
                clienteId: t.clienteId,
                driveFolderId: t.driveFolderId,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
