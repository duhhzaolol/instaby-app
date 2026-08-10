"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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

export function OrcamentoRow({
  slug,
  status,
  total,
  index,
  clienteNome,
  visualizadoEm,
}: {
  slug: string;
  status: string;
  total: number;
  index: number;
  clienteNome?: string;
  visualizadoEm?: string | null;
}) {
  const router = useRouter();

  async function excluir(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Excluir esse orçamento?")) return;
    await fetch(`/api/orcamento/${slug}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card index={index} className="flex items-center justify-between px-4 py-3">
      <a href={`/orcamento/${slug}`} target="_blank" className="min-w-0 flex-1">
        <p className="truncate text-sm text-text">{clienteNome ? clienteNome : `/orcamento/${slug}`}</p>
        <p className="text-xs text-muted">
          R$ {total.toFixed(0)}
          {visualizadoEm ? (
            <span className="text-emerald-400">
              {" "}
              · visto em {new Date(visualizadoEm).toLocaleDateString("pt-BR")}
            </span>
          ) : (
            <span> · ainda não visto</span>
          )}
        </p>
      </a>
      <div className="flex items-center gap-3">
        <Badge tone={tone[status]}>{label[status]}</Badge>
        <button onClick={excluir} className="text-muted hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );
}
