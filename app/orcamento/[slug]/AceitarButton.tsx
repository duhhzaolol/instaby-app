"use client";

import { useState } from "react";

export default function AceitarButton({ slug, status }: { slug: string; status: string }) {
  const [statusAtual, setStatusAtual] = useState(status);
  const [enviando, setEnviando] = useState(false);

  async function aceitar() {
    setEnviando(true);
    const resposta = await fetch(`/api/orcamento/${slug}/aceitar`, { method: "POST" });
    setEnviando(false);
    if (resposta.ok) setStatusAtual("aceito");
  }

  if (statusAtual === "aceito") {
    return (
      <div className="w-full rounded-lg bg-emerald-500/10 py-3 text-center text-sm font-medium text-emerald-400">
        Proposta aceita ✓
      </div>
    );
  }

  return (
    <button
      onClick={aceitar}
      disabled={enviando}
      className="w-full rounded-lg bg-[#FACC15] py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {enviando ? "Enviando..." : "Aceitar proposta"}
    </button>
  );
}
