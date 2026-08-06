import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ServicosPage() {
  const servicos = await prisma.servico.findMany({
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });

  const categorias = Array.from(new Set(servicos.map((s) => s.categoria)));

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-base font-medium text-white">Catálogo de serviços</p>
          <p className="text-xs text-muted">A base pra montar qualquer orçamento em pílulas</p>
        </div>
        <Link
          href="/dashboard/servicos/novo"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          + Novo serviço
        </Link>
      </div>

      {servicos.length === 0 && (
        <p className="text-sm text-muted">
          Nenhum serviço cadastrado ainda — cadastre o primeiro pra poder montar orçamentos.
        </p>
      )}

      {categorias.map((cat) => (
        <div key={cat} className="mb-6">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted">{cat}</p>
          <div className="flex flex-col gap-2">
            {servicos
              .filter((s) => s.categoria === cat)
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-white">{s.nome}</p>
                    <p className="text-xs text-muted">{s.descricao}</p>
                  </div>
                  <span className="text-sm text-white">
                    R$ {Number(s.valorUnitario).toFixed(0)}
                    <span className="text-xs text-muted">/{s.unidade}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
