import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PlanejamentoProducao, { type TarefaTrabalho } from "@/components/dashboard/PlanejamentoProducao";
import { getUsuarioAtual, clienteIdsPermitidos } from "@/lib/permissoes";

export default async function TarefasPage() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) redirect("/login");
  const idsPermitidos = await clienteIdsPermitidos(usuarioAtual);
  const filtroCliente = idsPermitidos ? { OR: [{ clienteId: null }, { clienteId: { in: idsPermitidos } }] } : {};

  const [tarefas, clientes] = await Promise.all([
    prisma.tarefa.findMany({
      where: filtroCliente,
      include: {
        cliente: { select: { nome: true, cor: true } },
        responsavel: { select: { nome: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cliente.findMany({
      where: { status: { not: "inativo" }, ...(idsPermitidos ? { id: { in: idsPermitidos } } : {}) },
      select: { id: true, nome: true, cor: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const trabalho: TarefaTrabalho[] = tarefas.map(t => ({
    id: t.id,
    titulo: t.titulo,
    tipo: t.tipo,
    status: t.status,
    categoria: t.categoria,
    prazo: t.prazo?.toISOString() || null,
    clienteId: t.clienteId,
    clienteNome: t.cliente?.nome || null,
    clienteCor: t.cliente?.cor || null,
    responsavelId: t.responsavelId,
    responsavelNome: t.responsavel?.nome || null,
    publicacaoSugeridaEm: t.publicacaoSugeridaEm?.toISOString() || null,
    statusConteudo: t.statusConteudo,
    publicadoEm: t.publicadoEm?.toISOString() || null,
    concluidaEm: t.concluidaEm?.toISOString() || null,
  }));

  return (
    <Suspense fallback={<p role="status" className="py-6 text-sm text-muted">Carregando planejamento e produção...</p>}>
      <PlanejamentoProducao tarefas={trabalho} clientes={clientes} />
    </Suspense>
  );
}
