import Link from "next/link";
import { prisma } from "@/lib/prisma";
import QuadroTarefas, { TarefaQuadro } from "@/components/dashboard/QuadroTarefas";
import { NovaTarefaGlobalForm } from "@/components/dashboard/NovaTarefaGlobalForm";
import { CalendarDays } from "lucide-react";
import { AjudaContextual } from "@/components/ui/AjudaContextual";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";

// Página principal de Tarefas — vira o mesmo quadro Kanban usado no resto do
// app (redesign v144, Parte 3), no lugar das abas Abertas/Concluídas/Todas:
// as 3 colunas do quadro já mostram tudo de uma vez, então as abas somem.
// "Nova tarefa" continua sendo uma ação separada (formulário próprio acima do
// quadro), não embutida dentro do board — pedido explícito.
export default async function TarefasPage() {
  const usuarioAtual = await getUsuarioAtual();
  const idsPermitidos = usuarioAtual ? await clienteIdsPermitidos(usuarioAtual) : null;
  // Tarefa sem cliente (interna/geral) continua visível pra todo mundo — só
  // restringe a que é de um cliente específico fora da lista permitida.
  const filtroCliente = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};

  const [tarefas, clientes] = await Promise.all([
    prisma.tarefa.findMany({
      where: filtroCliente,
      include: { cliente: { select: { nome: true, cor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" }, ...(idsPermitidos ? { id: { in: idsPermitidos } } : {}) },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const tarefasQuadro: TarefaQuadro[] = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    status: t.status,
    categoria: t.categoria,
    prazo: t.prazo?.toISOString() || null,
    clienteId: t.clienteId,
    clienteNome: t.cliente?.nome || null,
    clienteCor: t.cliente?.cor || null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-lg font-medium text-text">
            Tarefas
            <AjudaContextual
              titulo="Tarefas"
              texto="Todas as tarefas de todos os clientes, organizadas por status — arraste um cartão pra outra coluna pra mudar o status. Crie uma tarefa rápida pela Visão Geral ou aqui mesmo. Tarefas com data/horário aparecem também na Agenda."
              exemplo="Ex.: arraste um cartão de 'A fazer' pra 'Em andamento' quando começar a trabalhar nele."
            />
          </p>
          <p className="text-sm text-muted">Todas as tarefas, de todos os clientes, num lugar só</p>
        </div>
        <Link
          href="/dashboard/agenda?visao=tarefas"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-text hover:bg-hover"
        >
          <CalendarDays size={14} /> Ver tarefas na Agenda
        </Link>
      </div>

      <NovaTarefaGlobalForm clientes={clientes} />

      <QuadroTarefas tarefas={tarefasQuadro} titulo="Tarefas" linkVerTudo={null} />
    </div>
  );
}
