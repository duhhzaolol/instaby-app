"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
      <div className="mb-5">
        <Button size="sm" onClick={() => setAberto(true)}>
          <Plus size={14} /> Nova oportunidade
        </Button>
      </div>
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
      <Input
        autoFocus
        required
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Empresa ou nome"
        className="mb-3"
      />
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Input
          value={contatoWhatsapp}
          onChange={(e) => setContatoWhatsapp(e.target.value)}
          placeholder="WhatsApp (opcional)"
        />
        <Input
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          placeholder="Origem (opcional)"
        />
      </div>
      <Button type="submit" disabled={enviando || !nome.trim()} className="w-full">
        {enviando ? "Criando..." : "Criar"}
      </Button>
    </form>
  );
}
