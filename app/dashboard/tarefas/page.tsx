import { prisma } from "@/lib/prisma";
import { TarefaRow } from "@/components/dashboard/TarefaRow";
import { CheckSquare } from "lucide-react";

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

  const where =
    filtro === "feito"
      ? { status: "feito" }
      : filtro === "todas"
      ? {}
      : { status: { not: "feito" } };

  const tarefas = await prisma.tarefa.findMany({
    where,
    include: { cliente: { select: { nome: true, cor: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">Tarefas</p>
          <p className="text-sm text-muted">Todas as tarefas, de todos os clientes, num lugar só</p>
        </div>
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
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
