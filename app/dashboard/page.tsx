import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const modulos = [
  { nome: "Clientes", desc: "Tarefas, financeiro e orçamento por cliente", href: "/dashboard/clientes" },
  { nome: "Financeiro", desc: "Em breve", href: null },
  { nome: "Orçamento", desc: "Em breve", href: null },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-base font-medium">
          <span className="text-white">insta</span>
          <span className="text-accent">by</span>
        </span>
        <span className="text-sm text-muted">Olá, {session?.user?.name ?? "Duhzao"}</span>
      </div>

      <p className="mb-3 text-xs text-muted">Módulos</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {modulos.map((m) =>
          m.href ? (
            <Link
              key={m.nome}
              href={m.href}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="mb-1 text-sm font-medium text-white">{m.nome}</p>
              <p className="text-xs text-muted">{m.desc}</p>
            </Link>
          ) : (
            <div key={m.nome} className="rounded-xl border border-border bg-card p-4 opacity-60">
              <p className="mb-1 text-sm font-medium text-white">{m.nome}</p>
              <p className="text-xs text-muted">{m.desc}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
