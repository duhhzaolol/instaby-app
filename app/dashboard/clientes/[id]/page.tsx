import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NovaTarefaForm from "./NovaTarefaForm";

const tarefaStatusStyle: Record<string, string> = {
  a_fazer: "bg-[#2a2a2a] text-muted",
  em_andamento: "bg-[#3a2f1f] text-[#e0b87a]",
  feito: "bg-[#1f3a1f] text-[#7ed17e]",
};

const tarefaStatusLabel: Record<string, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  feito: "Feito",
};

export default async function ClienteDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aba?: string };
}) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      tarefas: { orderBy: { createdAt: "desc" } },
      orcamentos: { include: { itens: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!cliente) notFound();

  const aba = searchParams.aba || "tarefas";
  const abas = [
    { valor: "tarefas", label: "Tarefas" },
    { valor: "financeiro", label: "Financeiro" },
    { valor: "orcamentos", label: "Orçamentos" },
    { valor: "contratos", label: "Contratos" },
  ];

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <Link href="/dashboard/clientes" className="text-xs text-muted">
        ← Clientes
      </Link>

      <p className="mb-1 mt-3 text-lg font-medium text-white">{cliente.nome}</p>
      {cliente.whatsapp && <p className="mb-4 text-xs text-muted">{cliente.whatsapp}</p>}

      <div className="mb-4 flex gap-1 border-b border-border">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/clientes/${cliente.id}?aba=${a.valor}`}
            className={`px-3 py-2 text-sm ${
              aba === a.valor
                ? "border-b-2 border-accent text-white"
                : "text-muted"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {aba === "tarefas" && (
        <div>
          <div className="flex flex-col gap-2">
            {cliente.tarefas.length === 0 && (
              <p className="text-sm text-muted">Nenhuma tarefa ainda.</p>
            )}
            {cliente.tarefas.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-card px-3.5 py-3"
              >
                <div>
                  <p className="text-sm text-white">{t.titulo}</p>
                  <p className="text-xs text-muted">{t.tipo === "ideia" ? "Ideia" : "Tarefa"}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs ${tarefaStatusStyle[t.status]}`}>
                  {tarefaStatusLabel[t.status]}
                </span>
              </div>
            ))}
          </div>
          <NovaTarefaForm clienteId={cliente.id} />
        </div>
      )}

      {aba === "financeiro" && (
        <p className="text-sm text-muted">Módulo Financeiro chega na próxima entrega.</p>
      )}
      {aba === "orcamentos" && (
        <div>
          <div className="flex flex-col gap-2">
            {cliente.orcamentos.length === 0 && (
              <p className="text-sm text-muted">Nenhum orçamento enviado ainda.</p>
            )}
            {cliente.orcamentos.map((o) => {
              const total = o.itens.reduce((soma, item) => soma + Number(item.valor), 0);
              return (
                <a
                  key={o.id}
                  href={`/orcamento/${o.slug}`}
                  target="_blank"
                  className="flex items-center justify-between rounded-lg bg-card px-3.5 py-3"
                >
                  <div>
                    <p className="text-sm text-white">/orcamento/{o.slug}</p>
                    <p className="text-xs text-muted">R$ {total.toFixed(0)}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      o.status === "aceito"
                        ? "bg-[#1f3a1f] text-[#7ed17e]"
                        : o.status === "recusado"
                        ? "bg-[#3a1f1f] text-[#e08a8a]"
                        : "bg-[#2a2a2a] text-muted"
                    }`}
                  >
                    {o.status === "aceito" ? "Aceito" : o.status === "recusado" ? "Recusado" : "Pendente"}
                  </span>
                </a>
              );
            })}
          </div>
          <Link
            href={`/dashboard/clientes/${cliente.id}/orcamentos/novo`}
            className="mt-3 block w-full rounded-lg border border-border bg-card py-2.5 text-center text-sm text-white"
          >
            + Novo orçamento
          </Link>
        </div>
      )}
      {aba === "contratos" && (
        <p className="text-sm text-muted">Módulo de Contrato chega na próxima entrega.</p>
      )}
    </div>
  );
}
