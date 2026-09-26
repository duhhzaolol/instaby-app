import Link from "next/link";
import { FileText, Plus, Clock, Wallet, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { OrcamentoRow } from "@/components/dashboard/OrcamentoRow";

export default async function OrcamentosPage() {
  const orcamentos = await prisma.orcamento.findMany({
    orderBy: { createdAt: "desc" },
    include: { cliente: true, itens: true },
  });

  const orcamentosComTotal = orcamentos.map((o) => ({
    ...o,
    total: o.itens.reduce((soma, item) => soma + Number(item.valor), 0),
  }));

  const pendentes = orcamentosComTotal.filter((o) => o.status === "pendente");
  const aceitos = orcamentosComTotal.filter((o) => o.status === "aceito");
  const valorEmAberto = pendentes.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">Orçamentos</p>
          <p className="text-sm text-muted">{orcamentos.length} no total</p>
        </div>
        <Link href="/dashboard/orcamentos/novo">
          <Button size="sm">
            <Plus size={14} /> Novo orçamento
          </Button>
        </Link>
      </div>

      {orcamentos.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatTile
            icone={<Clock size={12} style={{ color: "#F59E0B" }} />}
            label="Pendentes"
            valor={pendentes.length}
            index={0}
          />
          <StatTile
            icone={<Wallet size={12} style={{ color: "#E63946" }} />}
            label="Valor em aberto"
            valor={`R$ ${valorEmAberto.toLocaleString("pt-BR")}`}
            index={1}
          />
          <StatTile
            icone={<CheckCircle2 size={12} style={{ color: "#22C55E" }} />}
            label="Aceitos"
            valor={aceitos.length}
            index={2}
          />
        </div>
      )}

      {orcamentos.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum orçamento enviado ainda"
          description="Clique em 'Novo orçamento' pra escolher o cliente e montar um."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {orcamentosComTotal.map((o, i) => (
            <OrcamentoRow
              key={o.id}
              slug={o.slug}
              status={o.status}
              total={o.total}
              index={i}
              clienteNome={o.cliente.nome}
              visualizadoEm={o.visualizadoEm?.toISOString() || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
