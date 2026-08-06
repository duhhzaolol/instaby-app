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
      <div className="w-full rounded-lg bg-[#1f3a1f] py-3 text-center text-sm font-medium text-[#7ed17e]">
        Proposta aceita ✓
      </div>
    );
  }

  return (
    <button
      onClick={aceitar}
      disabled={enviando}
      className="w-full rounded-lg bg-accent py-3 text-sm font-medium text-white disabled:opacity-60"
    >
      {enviando ? "Enviando..." : "Aceitar proposta"}
    </button>
  );
}
