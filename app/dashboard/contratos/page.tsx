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

  const renovacoesProximas = contratos
    .filter((c) => c.status === "assinado" && c.cliente.prazoContratoMeses)
    .map((c) => {
      const renovacao = new Date(c.createdAt);
      renovacao.setMonth(renovacao.getMonth() + c.cliente.prazoContratoMeses!);
      const dias = Math.round((renovacao.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { clienteNome: c.cliente.nome, clienteId: c.clienteId, dias };
    })
    .filter((r) => r.dias <= 30)
    .sort((a, b) => a.dias - b.dias);

  return (
    <div>
      <p className="mb-6 text-lg font-medium text-text">Contratos</p>

      {renovacoesProximas.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <p className="mb-1.5 text-xs font-medium text-amber-300">Renovação chegando</p>
          {renovacoesProximas.map((r) => (
            <Link key={r.clienteId} href={`/dashboard/clientes/${r.clienteId}`} className="block text-xs text-amber-100 hover:underline">
              {r.clienteNome} — {r.dias < 0 ? `vencido há ${Math.abs(r.dias)} dia(s)` : `renova em ${r.dias} dia(s)`}
            </Link>
          ))}
        </div>
      )}

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
