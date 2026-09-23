"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function InstrucoesCobrancaForm({ instrucoesAtuais }: { instrucoesAtuais: string }) {
  const router = useRouter();
  const [instrucoes, setInstrucoes] = useState(instrucoesAtuais);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrucoesCobranca: instrucoes || null }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <form onSubmit={salvar} className="max-w-sm">
      <textarea
        value={instrucoes}
        onChange={(e) => setInstrucoes(e.target.value)}
        rows={3}
        placeholder={"Ex: PIX (CNPJ): 00.000.000/0001-00\nBanco Inter — Instaby Agência"}
        className="mb-2 w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/50 focus:border-accent/50"
      />
      <Button type="submit" size="md" disabled={salvando}>
        {salvo ? "Salvo ✓" : salvando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
