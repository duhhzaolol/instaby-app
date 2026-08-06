"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoClientePage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState("lead");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, whatsapp, status }),
    });

    setEnviando(false);

    if (resposta.ok) {
      router.push("/dashboard/clientes");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-base px-6 py-8">
      <p className="mb-5 text-base font-medium text-white">Novo cliente</p>

      <form onSubmit={handleSubmit} className="max-w-sm">
        <label className="text-xs text-muted">Nome</label>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="mb-4 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
        />

        <label className="text-xs text-muted">WhatsApp</label>
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="(19) 99999-9999"
          className="mb-4 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
        />

        <label className="text-xs text-muted">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mb-6 mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-white outline-none focus:border-accent"
        >
          <option value="lead">Lead</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>

        <button
          type="submit"
          disabled={enviando}
          className="h-11 w-full rounded-lg bg-accent text-sm font-medium text-white disabled:opacity-60"
        >
          {enviando ? "Salvando..." : "Salvar cliente"}
        </button>
      </form>
    </div>
  );
}
