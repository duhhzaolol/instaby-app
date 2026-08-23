"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/Button";

export default function MetaFaturamentoForm({ metaAtual }: { metaAtual: number }) {
  const router = useRouter();
  const [meta, setMeta] = useState(metaAtual);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metaFaturamentoMensal: meta }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <form onSubmit={salvar} className="flex max-w-sm items-end gap-2">
      <div className="flex-1">
        <Label>Meta de faturamento por mês</Label>
        <CurrencyInput value={meta} onChange={setMeta} />
      </div>
      <Button type="submit" size="md" disabled={salvando}>
        {salvo ? "Salvo ✓" : salvando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
