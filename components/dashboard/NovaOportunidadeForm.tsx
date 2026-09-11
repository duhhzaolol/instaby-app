"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export function NovaOportunidadeForm() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [contatoWhatsapp, setContatoWhatsapp] = useState("");
  const [origem, setOrigem] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setEnviando(true);
    await fetch("/api/oportunidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, contatoWhatsapp: contatoWhatsapp || null, origem: origem || null }),
    });
    setEnviando(false);
    setNome("");
    setContatoWhatsapp("");
    setOrigem("");
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-5 flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={15} /> Nova oportunidade
      </button>
    );
  }

  return (
    <form onSubmit={salvar} className="mb-5 rounded-2xl border border-border bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-text">Nova oportunidade</p>
        <button type="button" onClick={() => setAberto(false)} className="text-muted hover:text-text">
          <X size={16} />
        </button>
      </div>
      <input
        autoFocus
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Empresa ou nome"
        className="mb-3 h-10 w-full rounded-xl border border-border bg-base/60 px-3.5 text-sm text-text"
      />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <input
          value={contatoWhatsapp}
          onChange={(e) => setContatoWhatsapp(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="h-10 rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
        <input
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          placeholder="Origem (opcional)"
          className="h-10 rounded-xl border border-border bg-base/60 px-3 text-sm text-text"
        />
      </div>
      <button
        type="submit"
        disabled={enviando || !nome.trim()}
        className="h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-40"
      >
        {enviando ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
