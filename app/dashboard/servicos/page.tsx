import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function ServicosPage() {
  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  const categorias = Array.from(new Set(servicos.map((s) => s.categoria)));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">Catálogo de serviços</p>
          <p className="text-sm text-muted">A base pra montar qualquer orçamento em pílulas</p>
        </div>
        <Link href="/dashboard/servicos/novo">
          <Button size="sm">
            <Plus size={14} /> Novo serviço
          </Button>
        </Link>
      </div>

      {servicos.length === 0 && (
        <p className="text-sm text-muted">
          Nenhum serviço cadastrado ainda — cadastre o primeiro pra poder montar orçamentos.
        </p>
      )}

      {categorias.map((cat) => (
        <div key={cat} className="mb-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">{cat}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {servicos
              .filter((s) => s.categoria === cat)
              .map((s, i) => (
                <Card key={s.id} index={i} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-text">{s.nome}</p>
                    <p className="text-xs text-muted">{s.descricao}</p>
                  </div>
                  <span className="whitespace-nowrap text-sm text-text">
                    R$ {Number(s.valorUnitario).toFixed(0)}
                    <span className="text-xs text-muted">/{s.unidade}</span>
                  </span>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
