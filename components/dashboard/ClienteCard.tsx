import Link from "next/link";
import { Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ValorOcultavelTexto } from "@/components/ui/ValorOcultavelTexto";

const statusTone: Record<string, "yellow" | "green" | "gray" | "blue"> = {
  lead: "yellow",
  ativo: "green",
  avulso: "blue",
  inativo: "gray",
};

const statusLabel: Record<string, string> = {
  lead: "Lead",
  ativo: "Ativo",
  avulso: "Avulso",
  inativo: "Inativo",
};

export type ClienteCardData = {
  id: string;
  nome: string;
  whatsapp: string | null;
  logoUrl: string | null;
  cor: string | null;
  status: string;
  mensalidade: number;
  totalRecebido: number;
};

export function ClienteCard({ cliente, index }: { cliente: ClienteCardData; index?: number }) {
  const c = cliente;
  const iniciais = c.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link href={`/dashboard/clientes/${c.id}`}>
      <Card index={index} className="p-4" style={c.cor ? { borderLeft: `3px solid ${c.cor}` } : undefined}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {c.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logoUrl} alt={c.nome} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold"
                style={{ backgroundColor: `${c.cor || "#E63946"}1A`, color: c.cor || "#E63946" }}
              >
                {iniciais}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text">{c.nome}</p>
              {c.whatsapp && (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Phone size={11} /> {c.whatsapp}
                </p>
              )}
            </div>
          </div>
          <Badge tone={statusTone[c.status]}>{statusLabel[c.status]}</Badge>
        </div>

        {(c.mensalidade > 0 || c.totalRecebido > 0) && (
          <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
            <div>
              <p className="text-xs text-muted">Mensalidade</p>
              <p className="text-sm font-medium text-text">
                {c.mensalidade > 0 ? (
                  <ValorOcultavelTexto>R$ {c.mensalidade.toLocaleString("pt-BR")}</ValorOcultavelTexto>
                ) : (
                  "Sem serviços"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Recebido até agora</p>
              <p className="text-sm font-medium text-text">
                <ValorOcultavelTexto>R$ {c.totalRecebido.toLocaleString("pt-BR")}</ValorOcultavelTexto>
              </p>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
