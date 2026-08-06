import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const tone: Record<string, "green" | "red" | "gray"> = {
  aceito: "green",
  recusado: "red",
  pendente: "gray",
};

const label: Record<string, string> = {
  aceito: "Aceito",
  recusado: "Recusado",
  pendente: "Pendente",
};

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
              <Link key={o.id} href={`/dashboard/clientes/${o.clienteId}?aba=orcamentos`}>
                <Card index={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-text">{o.cliente.nome}</p>
                    <p className="text-xs text-muted">/orcamento/{o.slug} · R$ {total.toFixed(0)}</p>
                  </div>
                  <Badge tone={tone[o.status]}>{label[o.status]}</Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
