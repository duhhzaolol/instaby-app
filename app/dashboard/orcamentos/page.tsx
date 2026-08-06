import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrcamentoRow } from "@/components/dashboard/OrcamentoRow";

export default async function OrcamentosPage() {
  const orcamentos = await prisma.orcamento.findMany({
    orderBy: { createdAt: "desc" },
    include: { cliente: true, itens: true },
  });

  return (
    <div>
      <p className="mb-6 text-lg font-medium text-text">Orçamentos</p>

      {orcamentos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento enviado ainda"
          description="Entre no cliente e crie um orçamento pela aba Orçamentos."
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
