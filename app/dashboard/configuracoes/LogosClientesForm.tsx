"use client";

import { useRouter } from "next/navigation";

type Cliente = { id: string; nome: string; logoUrl: string; exibirLogoPublico: boolean };

export default function LogosClientesForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();

  async function alternar(id: string, valorAtual: boolean) {
    await fetch(`/api/clientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exibirLogoPublico: !valorAtual }),
    });
    router.refresh();
  }

  if (clientes.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nenhum cliente com logo cadastrado ainda — adicione um link de logo na edição do cliente primeiro.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {clientes.map((c) => (
        <button
          key={c.id}
          onClick={() => alternar(c.id, c.exibirLogoPublico)}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
            c.exibirLogoPublico ? "border-accent/40 bg-accent/5" : "border-border bg-card/40"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logoUrl} alt={c.nome} className="h-10 w-auto object-contain grayscale" />
          <span className="text-xs text-text">{c.nome}</span>
          <span className={`text-[10px] ${c.exibirLogoPublico ? "text-accent" : "text-muted"}`}>
            {c.exibirLogoPublico ? "Aparece nas propostas" : "Clique pra ativar"}
          </span>
        </button>
      ))}
    </div>
  );
}
