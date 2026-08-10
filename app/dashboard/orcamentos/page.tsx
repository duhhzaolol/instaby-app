import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OrcamentoRow } from "@/components/dashboard/OrcamentoRow";

export default async function OrcamentosPage() {
  const orcamentos = await prisma.orcamento.findMany({
    orderBy: { createdAt: "desc" },
    include: { cliente: true, itens: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-lg font-medium text-text">Orçamentos</p>
        <Link href="/dashboard/orcamentos/novo">
          <Button size="sm">
            <Plus size={14} /> Novo orçamento
          </Button>
        </Link>
      </div>

      {orcamentos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento enviado ainda"
          description="Clique em 'Novo orçamento' pra escolher o cliente e montar um."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {orcamentos.map((o, i) => {
            const total = o.itens.reduce((soma, item) => soma + Number(item.valor), 0);
            return (
              <OrcamentoRow
                key={o.id}
                slug={o.slug}
                status={o.status}
                total={total}
                index={i}
                clienteNome={o.cliente.nome}
                visualizadoEm={o.visualizadoEm?.toISOString() || null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
