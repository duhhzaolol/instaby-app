import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default async function EscolherClienteOrcamentoPage() {
  const clientes = await prisma.cliente.findMany({
    where: { status: { not: "inativo" } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="max-w-lg">
      <p className="mb-1 text-lg font-medium text-text">Novo orçamento</p>
      <p className="mb-5 text-sm text-muted">Pra qual cliente?</p>

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado ainda"
          description="Cadastre um cliente primeiro pra poder montar um orçamento pra ele."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {clientes.map((c, i) => (
            <Link key={c.id} href={`/dashboard/clientes/${c.id}/orcamentos/novo`}>
              <Card index={i} className="px-4 py-3">
                <p className="text-sm text-text">{c.nome}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
