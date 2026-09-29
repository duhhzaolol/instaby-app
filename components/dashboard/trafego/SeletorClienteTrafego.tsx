import Link from "next/link";
import { Building2 } from "lucide-react";

type Cliente = { id: string; nome: string; cor: string | null };

// Seletor de cliente compartilhado pelas telas que operam sobre UM cliente por vez
// (Visão Geral, Verba e Movimentações, Histórico de Importações, Relatórios) — troca
// de cliente via URL (?clienteId=), então cada tela continua um link direto/compartilhável.
export function SeletorClienteTrafego({
  clientes,
  clienteIdAtual,
  visao,
}: {
  clientes: Cliente[];
  clienteIdAtual?: string;
  visao: string;
}) {
  if (!clienteIdAtual) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-text">
          <Building2 size={14} className="text-accent" /> Escolha um cliente
        </p>
        {clientes.length === 0 ? (
          <p className="text-sm text-muted">Nenhum cliente disponível.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {clientes.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/trafego?visao=${visao}&clienteId=${c.id}`}
                className="rounded-full border border-border bg-base/60 px-3 py-1.5 text-xs text-text hover:border-accent/40"
                style={c.cor ? { borderColor: `${c.cor}40` } : undefined}
              >
                {c.nome}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const clienteAtual = clientes.find((c) => c.id === clienteIdAtual);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">Cliente:</span>
      <select
        defaultValue={clienteIdAtual}
        onChange={(e) => {
          window.location.href = `/dashboard/trafego?visao=${visao}&clienteId=${e.target.value}`;
        }}
        className="h-8 rounded-lg border border-border bg-base/60 px-2 text-xs text-text"
      >
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      {clienteAtual?.cor && (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: clienteAtual.cor }} />
      )}
    </div>
  );
}
