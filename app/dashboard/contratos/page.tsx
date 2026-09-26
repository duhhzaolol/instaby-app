import Link from "next/link";
import { FileSignature, Send, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";

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

  const contagemPorStatus: Record<string, number> = {};
  for (const c of contratos) contagemPorStatus[c.status] = (contagemPorStatus[c.status] || 0) + 1;

  return (
    <div>
      <div className="mb-6">
        <p className="text-lg font-medium text-text">Contratos</p>
        <p className="text-sm text-muted">{contratos.length} no total</p>
      </div>

      {contratos.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatTile
            icone={<FileSignature size={12} style={{ color: "#22C55E" }} />}
            label="Assinados"
            valor={contagemPorStatus.assinado || 0}
            index={0}
          />
          <StatTile
            icone={<Send size={12} style={{ color: "#F59E0B" }} />}
            label="Enviados"
            valor={contagemPorStatus.enviado || 0}
            index={1}
          />
          <StatTile
            icone={<Clock size={12} style={{ color: "#F59E0B" }} />}
            label="Renovando em breve"
            valor={renovacoesProximas.length}
            index={2}
          />
        </div>
      )}

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
