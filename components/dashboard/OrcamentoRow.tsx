"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <Card index={index} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <a href={`/orcamento/${slug}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 basis-36">
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
      <div className="flex flex-wrap items-center gap-3">
        {status !== "aceito" && (
          <Link href={`/dashboard/orcamentos/${slug}/editar`} className="text-xs font-medium text-accent hover:underline">
            Personalizar
          </Link>
        )}
        <Badge tone={tone[status]}>{label[status]}</Badge>
        <button type="button" onClick={excluir} aria-label="Excluir orçamento" className="text-muted hover:text-red-400">
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
