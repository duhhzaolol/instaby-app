"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MessageSquareQuote } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type Depoimento = { id: string; nomeCliente: string; texto: string };

export default function DepoimentosForm({ depoimentos }: { depoimentos: Depoimento[] }) {
  const router = useRouter();
  const [nomeCliente, setNomeCliente] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);

    const resposta = await fetch("/api/depoimentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeCliente, texto }),
    });

    setEnviando(false);

    if (resposta.ok) {
      setNomeCliente("");
      setTexto("");
      router.refresh();
    }
  }

  async function remover(id: string) {
    await fetch(`/api/depoimentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: false }),
    });
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card hoverable={false} className="p-5">
        <form onSubmit={handleSubmit}>
          <Label>Nome do cliente</Label>
          <Input
            required
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            placeholder="Skyfit Araras"
            className="mb-4"
          />

          <Label>Depoimento</Label>
          <Textarea
            required
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder="A Instaby organizou nossa presença digital..."
            className="mb-4"
          />

          <Button type="submit" disabled={enviando} className="w-full">
            <Plus size={14} /> {enviando ? "Salvando..." : "Adicionar depoimento"}
          </Button>
        </form>
      </Card>

      <div>
        {depoimentos.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="Nenhum depoimento ainda"
            description="Adicione pelo menos um pra ele aparecer nas propostas que você enviar."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {depoimentos.map((d, i) => (
              <Card key={d.id} index={i} hoverable={false} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-text">{d.nomeCliente}</p>
                  <button onClick={() => remover(d.id)} className="text-muted hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-muted">{d.texto}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
