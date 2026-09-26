import Link from "next/link";
import { Plus, Package2, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import PacoteCard from "./PacoteCard";

export default async function PacotesPage() {
  const pacotes = await prisma.pacote.findMany({
    include: { itens: { include: { servico: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totais = pacotes.map((p) =>
    p.itens.reduce((s, it) => s + Number(it.servico.valorUnitario) * it.quantidade, 0)
  );
  const ticketMedio = totais.length > 0 ? totais.reduce((s, t) => s + t, 0) / totais.length : 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">Pacotes</p>
          <p className="text-sm text-muted">Combine serviços do catálogo pra aplicar num orçamento com um clique</p>
        </div>
        <Link href="/dashboard/pacotes/novo">
          <Button size="sm">
            <Plus size={14} /> Novo pacote
          </Button>
        </Link>
      </div>

      {pacotes.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatTile
            icone={<Package2 size={12} style={{ color: "#3B82F6" }} />}
            label="Pacotes cadastrados"
            valor={pacotes.length}
            index={0}
          />
          <StatTile
            icone={<Wallet size={12} style={{ color: "#E63946" }} />}
            label="Ticket médio"
            valor={`R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
            index={1}
          />
        </div>
      )}

      {pacotes.length === 0 ? (
        <EmptyState
          icon={Package2}
          title="Nenhum pacote ainda"
          description="Crie combinações de serviços — tipo 'Plano Crescimento' — pra montar orçamentos mais rápido."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {pacotes.map((p, i) => (
            <PacoteCard
              key={p.id}
              index={i}
              pacote={{
                id: p.id,
                nome: p.nome,
                descricao: p.descricao,
                itens: p.itens.map((it) => ({
                  id: it.id,
                  quantidade: it.quantidade,
                  servico: { nome: it.servico.nome, valorUnitario: Number(it.servico.valorUnitario) },
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
