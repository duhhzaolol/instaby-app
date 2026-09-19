"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const DIFERENCIAIS_PADRAO = [
  { titulo: "Proximidade", texto: "Atendimento direto e humano." },
  { titulo: "Agilidade", texto: "Do planejamento à execução." },
  { titulo: "Transparência", texto: "Relatórios claros e sem enrolação." },
  { titulo: "Foco em resultado", texto: "Tudo com um propósito: o crescimento do seu negócio." },
];

type DiferencialOverride = { titulo: string; texto: string };

export default function DiferenciaisForm({ diferenciais }: { diferenciais: DiferencialOverride[] | null }) {
  const router = useRouter();
  const [itens, setItens] = useState<DiferencialOverride[]>(
    DIFERENCIAIS_PADRAO.map((padrao, i) => ({
      titulo: diferenciais?.[i]?.titulo || padrao.titulo,
      texto: diferenciais?.[i]?.texto || padrao.texto,
    }))
  );
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizar(i: number, campo: keyof DiferencialOverride, valor: string) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteDiferenciais: itens }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-[11px] text-muted">Os 4 itens da faixa de diferenciais, logo abaixo do "Quem somos".</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {itens.map((item, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-base/40 p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">Diferencial {i + 1}</p>
            <Label>Título</Label>
            <Input value={item.titulo} onChange={(e) => atualizar(i, "titulo", e.target.value)} className="mb-2" />
            <Label>Descrição curta</Label>
            <Textarea value={item.texto} onChange={(e) => atualizar(i, "texto", e.target.value)} rows={2} />
          </div>
        ))}
      </div>
      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar diferenciais"}
      </Button>
    </div>
  );
}
