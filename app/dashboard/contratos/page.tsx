import Link from "next/link";
import { FileSignature } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const tone: Record<string, "gray" | "yellow" | "green"> = {
  rascunho: "gray",
  enviado: "yellow",
  assinado: "green",
};

const label: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  assinado: "Assinado",
};

export default async function ContratosGlobalPage() {
  const contratos = await prisma.contrato.findMany({
    orderBy: { createdAt: "desc" },
    include: { cliente: true },
  });

  return (
    <div>
      <p className="mb-6 text-lg font-medium text-text">Contratos</p>

      {contratos.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Nenhum contrato ainda"
          description="Entre no cliente, aba Contratos, e gere um a partir de um orçamento aceito."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {contratos.map((c, i) => (
            <Link key={c.id} href={`/dashboard/clientes/${c.clienteId}?aba=contratos`}>
              <Card index={i} className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-text">{c.cliente.nome}</p>
                <Badge tone={tone[c.status]}>{label[c.status]}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
