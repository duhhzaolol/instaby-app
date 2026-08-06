import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import NovaTarefaForm from "./NovaTarefaForm";
import ContratosTab from "./ContratosTab";
import FinanceiroTab from "./FinanceiroTab";

const tarefaTone: Record<string, "gray" | "yellow" | "green"> = {
  a_fazer: "gray",
  em_andamento: "yellow",
  feito: "green",
};

const tarefaStatusLabel: Record<string, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  feito: "Feito",
};

const orcamentoTone: Record<string, "green" | "red" | "gray"> = {
  aceito: "green",
  recusado: "red",
  pendente: "gray",
};

const orcamentoLabel: Record<string, string> = {
  aceito: "Aceito",
  recusado: "Recusado",
  pendente: "Pendente",
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
      contratos: { orderBy: { createdAt: "desc" } },
      cobrancas: { orderBy: { createdAt: "desc" } },
      despesas: { orderBy: { data: "desc" } },
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

  const orcamentosAceitos = cliente.orcamentos.filter((o) => o.status === "aceito");

  return (
    <div>
      <Link href="/dashboard/clientes" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted hover:text-text">
        <ArrowLeft size={13} /> Clientes
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">{cliente.nome}</p>
          {cliente.whatsapp && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <Phone size={11} /> {cliente.whatsapp}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/clientes/${cliente.id}?aba=${a.valor}`}
            className={`px-3 py-2.5 text-sm transition-colors ${
              aba === a.valor
                ? "border-b-2 border-accent font-medium text-text"
                : "text-muted hover:text-text"
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
            {cliente.tarefas.map((t, i) => (
              <Card key={t.id} index={i} hoverable={false} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-text">{t.titulo}</p>
                  <p className="text-xs text-muted">{t.tipo === "ideia" ? "Ideia" : "Tarefa"}</p>
                </div>
                <Badge tone={tarefaTone[t.status]}>{tarefaStatusLabel[t.status]}</Badge>
              </Card>
            ))}
          </div>
          <NovaTarefaForm clienteId={cliente.id} />
        </div>
      )}

      {aba === "financeiro" && (
        <FinanceiroTab
          cobrancas={cliente.cobrancas.map((c) => ({
            id: c.id,
            valor: Number(c.valor),
            status: c.status,
            tipo: c.tipo,
            vencimento: c.vencimento?.toISOString() || null,
          }))}
          despesas={cliente.despesas.map((d) => ({
            id: d.id,
            descricao: d.descricao,
            valor: Number(d.valor),
            data: d.data.toISOString(),
          }))}
        />
      )}

      {aba === "orcamentos" && (
        <div>
          <div className="flex flex-col gap-2">
            {cliente.orcamentos.length === 0 && (
              <p className="text-sm text-muted">Nenhum orçamento enviado ainda.</p>
            )}
            {cliente.orcamentos.map((o, i) => {
              const total = o.itens.reduce((soma, item) => soma + Number(item.valor), 0);
              return (
                <a key={o.id} href={`/orcamento/${o.slug}`} target="_blank">
                  <Card index={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-text">/orcamento/{o.slug}</p>
                      <p className="text-xs text-muted">R$ {total.toFixed(0)}</p>
                    </div>
                    <Badge tone={orcamentoTone[o.status]}>{orcamentoLabel[o.status]}</Badge>
                  </Card>
                </a>
              );
            })}
          </div>
          <Link
            href={`/dashboard/clientes/${cliente.id}/orcamentos/novo`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text transition-colors hover:bg-hover"
          >
            <Plus size={14} /> Novo orçamento
          </Link>
        </div>
      )}

      {aba === "contratos" && (
        <ContratosTab
          clienteId={cliente.id}
          contratos={cliente.contratos.map((c) => ({
            id: c.id,
            conteudo: c.conteudo,
            status: c.status,
            orcamentoId: c.orcamentoId,
          }))}
          orcamentosAceitos={orcamentosAceitos.map((o) => ({ id: o.id, slug: o.slug }))}
        />
      )}
    </div>
  );
}
