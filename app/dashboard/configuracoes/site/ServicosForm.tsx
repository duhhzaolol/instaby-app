"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// Os 8 serviços são um conjunto fixo (a seção é desenhada pra 4 colunas × 2
// linhas) — o que dá pra editar é o texto e o destino de cada um. O ícone
// de cada posição é fixo (definido no código do site), pra manter a grade
// visualmente consistente.
export const SERVICOS_PADRAO = [
  { nome: "Social Media", descricao: "Planejamento, conteúdo e gestão de redes sociais no dia a dia.", destino: "#servicos" },
  { nome: "Tráfego Pago", descricao: "Campanhas no Meta Ads e Google Ads com foco em resultado real.", destino: "#servicos" },
  { nome: "Captação de vídeo", descricao: "Produção em estúdio ou externa, com equipamento e direção.", destino: "#servicos" },
  { nome: "Edição de vídeo", descricao: "Cortes, Reels e vídeos institucionais com identidade da marca.", destino: "#servicos" },
  { nome: "Landing Pages", descricao: "Páginas rápidas, responsivas e pensadas pra converter.", destino: "#servicos" },
  { nome: "Google Meu Negócio", descricao: "Presença local otimizada — avaliações, fotos e posicionamento.", destino: "#servicos" },
  { nome: "Consultoria", descricao: "Diagnóstico e direção estratégica pro marketing do seu negócio.", destino: "#servicos" },
  { nome: "Apps e soluções digitais", descricao: "Ferramentas e sistemas sob medida pra necessidades específicas.", destino: "#servicos" },
];

type ServicoOverride = { nome: string; descricao: string; destino: string };

export default function ServicosForm({ servicos }: { servicos: ServicoOverride[] | null }) {
  const router = useRouter();
  const [itens, setItens] = useState<ServicoOverride[]>(
    SERVICOS_PADRAO.map((padrao, i) => ({
      nome: servicos?.[i]?.nome || padrao.nome,
      descricao: servicos?.[i]?.descricao || padrao.descricao,
      destino: servicos?.[i]?.destino || padrao.destino,
    }))
  );
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function atualizar(i: number, campo: keyof ServicoOverride, valor: string) {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));
  }

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    await fetch("/api/configuracao", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteServicos: itens }),
    });
    setSalvando(false);
    setSalvo(true);
    router.refresh();
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-5">
      <p className="text-[11px] text-muted">
        Os 8 cartões da seção "Serviços" do site — nome, descrição e destino do link de cada um. O destino pode ser
        um endereço (https://...), um link do WhatsApp, ou uma âncora da própria página (ex: #servicos).
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {itens.map((item, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-base/40 p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">Serviço {i + 1}</p>
            <Label>Nome</Label>
            <Input value={item.nome} onChange={(e) => atualizar(i, "nome", e.target.value)} className="mb-2" />
            <Label>Descrição curta</Label>
            <Textarea value={item.descricao} onChange={(e) => atualizar(i, "descricao", e.target.value)} rows={2} className="mb-2" />
            <Label>Destino do link</Label>
            <Input value={item.destino} onChange={(e) => atualizar(i, "destino", e.target.value)} placeholder="#servicos" />
          </div>
        ))}
      </div>
      <Button onClick={salvar} disabled={salvando} className="w-full">
        {salvo ? <Check size={14} /> : null} {salvando ? "Salvando..." : salvo ? "Salvo!" : "Salvar serviços"}
      </Button>
    </div>
  );
}
