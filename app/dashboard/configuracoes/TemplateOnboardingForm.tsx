"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TEMPLATE_ONBOARDING } from "@/lib/onboardingTemplate";

export default function TemplateOnboardingForm({ templateAtual }: { templateAtual: string[] }) {
  const router = useRouter();
  const [itens, setItens] = useState<string[]>(templateAtual.length > 0 ? templateAtual : TEMPLATE_ONBOARDING);
  const [novoItem, setNovoItem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function adicionar() {
    if (!novoItem.trim()) return;
    setItens((a) => [...a, novoItem.trim()]);
    setNovoItem("");
  }

  function remover(i: number) {
    setItens((a) => a.filter((_, idx) => idx !== i));
  }

  async function salvar() {
    setSalvando(true);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateOnboarding: itens }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2000);
  }

  return (
    <div className="max-w-md">
      <div className="mb-3 flex flex-col gap-1.5">
        {itens.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2">
            <span className="flex-1 text-sm text-text">{item}</span>
            <button onClick={() => remover(i)} className="text-muted hover:text-red-400">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="mb-3 flex gap-2">
        <input
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
          placeholder="Novo item do checklist"
          className="h-9 flex-1 rounded-lg border border-border bg-card/60 px-3 text-sm text-text"
        />
        <button onClick={adicionar} className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Plus size={14} />
        </button>
      </div>
      <Button size="sm" onClick={salvar} disabled={salvando}>
        {salvo ? "Salvo ✓" : salvando ? "Salvando..." : "Salvar template"}
      </Button>
    </div>
  );
}
