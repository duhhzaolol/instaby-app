"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Cobranca = { id: string; valor: number; status: string; tipo: string; vencimento: string | null };
type Despesa = { id: string; descricao: string; valor: number; data: string };

const tone: Record<string, "green" | "red" | "yellow"> = {
  pago: "green",
  atrasado: "red",
  pendente: "yellow",
};

const label: Record<string, string> = {
  pago: "Pago",
  atrasado: "Atrasado",
  pendente: "Pendente",
};

export default function FinanceiroTab({
  cobrancas,
  despesas,
}: {
  cobrancas: Cobranca[];
  despesas: Despesa[];
}) {
  const router = useRouter();

  async function marcarPago(id: string) {
    await fetch(`/api/cobrancas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago" }),
    });
    router.refresh();
  }

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Cobranças</p>
      <div className="mb-6 flex flex-col gap-2">
        {cobrancas.length === 0 && <p className="text-sm text-muted">Nenhuma cobrança ainda.</p>}
        {cobrancas.map((c, i) => (
          <Card key={c.id} index={i} hoverable={false} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-text">R$ {c.valor.toFixed(0)}</p>
              <p className="text-xs text-muted">
                {c.tipo === "recorrente" ? "Recorrente" : "Única"}
                {c.vencimento && ` · vence ${new Date(c.vencimento).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={tone[c.status]}>{label[c.status]}</Badge>
              {c.status !== "pago" && (
                <button onClick={() => marcarPago(c.id)} className="text-xs font-medium text-accent hover:underline">
                  Marcar pago
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Despesas</p>
      <div className="flex flex-col gap-2">
        {despesas.length === 0 && <p className="text-sm text-muted">Nenhuma despesa ainda.</p>}
        {despesas.map((d, i) => (
          <Card key={d.id} index={i} hoverable={false} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-text">{d.descricao}</p>
              <p className="text-xs text-muted">{new Date(d.data).toLocaleDateString("pt-BR")}</p>
            </div>
            <span className="text-sm text-text">R$ {d.valor.toFixed(0)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
