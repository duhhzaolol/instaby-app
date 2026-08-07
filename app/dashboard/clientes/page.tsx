import Link from "next/link";
import { Plus, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const statusTone: Record<string, "yellow" | "green" | "gray"> = {
  lead: "yellow",
  ativo: "green",
  inativo: "gray",
};

const statusLabel: Record<string, string> = {
  lead: "Lead",
  ativo: "Ativo",
  inativo: "Inativo",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filtro = searchParams.status || "todos";

  const clientes = await prisma.cliente.findMany({
    where: filtro !== "todos" ? { status: filtro } : undefined,
    orderBy: { createdAt: "desc" },
    include: { cobrancas: true, servicosContratados: { where: { ativo: true } } },
  });

  const abas = [
    { valor: "todos", label: "Todos" },
    { valor: "lead", label: "Lead" },
    { valor: "ativo", label: "Ativo" },
    { valor: "inativo", label: "Inativo" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-text">Clientes</p>
          <p className="text-sm text-muted">{clientes.length} no total</p>
        </div>
        <Link href="/dashboard/clientes/novo">
          <Button size="sm">
            <Plus size={14} /> Novo cliente
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/clientes?status=${a.valor}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filtro === a.valor
                ? "bg-accent text-white"
                : "border border-border bg-card/60 text-muted hover:text-text"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {clientes.length === 0 && (
        <p className="text-sm text-muted">Nenhum cliente por aqui ainda.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((c, i) => {
          const somaServicos = c.servicosContratados.reduce((soma, sc) => soma + Number(sc.valor), 0);
          const servicosComDesconto = somaServicos > 0 ? Math.max(0, somaServicos - Number(c.descontoMensal)) : 0;
          const recorrentes = c.cobrancas
            .filter((cb) => cb.tipo === "recorrente")
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const mensalidade = servicosComDesconto > 0 ? servicosComDesconto : recorrentes.length > 0 ? Number(recorrentes[0].valor) : 0;
          const totalRecebido = c.cobrancas
            .filter((cb) => cb.status === "pago")
            .reduce((soma, cb) => soma + Number(cb.valor), 0);
          const iniciais = c.nome
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <Link key={c.id} href={`/dashboard/clientes/${c.id}`}>
              <Card index={i} className="p-4">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt={c.nome}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-sm font-semibold text-accent">
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

                {(mensalidade > 0 || totalRecebido > 0) && (
                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted">Mensalidade</p>
                      <p className="text-sm font-medium text-text">
                        {mensalidade > 0 ? `R$ ${mensalidade.toLocaleString("pt-BR")}` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Recebido até agora</p>
                      <p className="text-sm font-medium text-text">
                        R$ {totalRecebido.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
