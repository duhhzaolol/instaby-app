import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  lead: "Lead",
  ativo: "Ativo",
  inativo: "Inativo",
};

const statusStyle: Record<string, string> = {
  lead: "bg-[#3a2f1f] text-[#e0b87a]",
  ativo: "bg-[#1f3a1f] text-[#7ed17e]",
  inativo: "bg-[#2a2a2a] text-muted",
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
  });

  const abas = [
    { valor: "todos", label: "Todos" },
    { valor: "lead", label: "Lead" },
    { valor: "ativo", label: "Ativo" },
    { valor: "inativo", label: "Inativo" },
  ];

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-base font-medium text-white">Clientes</p>
        <Link
          href="/dashboard/clientes/novo"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo cliente
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {abas.map((a) => (
          <Link
            key={a.valor}
            href={`/dashboard/clientes?status=${a.valor}`}
            className={`rounded-full px-3 py-1 text-xs ${
              filtro === a.valor
                ? "bg-accent text-white"
                : "border border-border bg-card text-muted"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {clientes.length === 0 && (
          <p className="text-sm text-muted">Nenhum cliente por aqui ainda.</p>
        )}
        {clientes.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/clientes/${c.id}`}
            className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-white">{c.nome}</p>
              {c.whatsapp && <p className="text-xs text-muted">{c.whatsapp}</p>}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs ${statusStyle[c.status]}`}>
              {statusLabel[c.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
