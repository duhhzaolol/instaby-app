"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <div className="max-w-md">
      <p className="mb-5 text-lg font-medium text-text">Novo cliente</p>

      <Card hoverable={false} className="p-5">
        <form onSubmit={handleSubmit}>
          <Label>Nome</Label>
          <Input required value={nome} onChange={(e) => setNome(e.target.value)} className="mb-4" />

          <Label>WhatsApp</Label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(19) 99999-9999"
            className="mb-4"
          />

          <Label>Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mb-6 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none focus:border-accent/50"
          >
            <option value="lead">Lead</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? "Salvando..." : "Salvar cliente"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
