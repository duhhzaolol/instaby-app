"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Cliente = { id: string; nome: string };

function horaAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function NovoRegistroTempoForm({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [atividade, setAtividade] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState(horaAtual());
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!atividade.trim() || !inicio) return;
    setEnviando(true);

    await fetch("/api/registros-tempo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        atividade,
        clienteId: clienteId || null,
        inicio: `${data}T${inicio}:00`,
        fim: fim ? `${data}T${fim}:00` : null,
      }),
    });

    setAtividade("");
    setInicio("");
    setEnviando(false);
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mb-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-3 text-sm text-text transition-colors hover:bg-hover"
      >
        <Plus size={15} /> Registrar horas
      </button>
    );
  }

  return (
    <Card hoverable={false} className="mb-6 p-4">
      <form onSubmit={handleSubmit}>
        <Label>O que você fez</Label>
        <input
          list="atividades-comuns"
          required
          value={atividade}
          onChange={(e) => setAtividade(e.target.value)}
          placeholder="Captação, Edição, Reunião..."
          className="mb-3 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text outline-none focus:border-accent/50"
        />
        <datalist id="atividades-comuns">
          <option value="Captação" />
          <option value="Edição" />
          <option value="Reunião" />
          <option value="Planejamento" />
          <option value="Tráfego pago" />
          <option value="Relatório" />
        </datalist>

        <Label>Cliente</Label>
        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        >
          <option value="">Sem cliente / interno</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div>
            <Label>Data</Label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/60 px-2 text-sm text-text"
            />
          </div>
          <div>
            <Label>Início</Label>
            <input
              type="time"
              required
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/60 px-2 text-sm text-text"
            />
          </div>
          <div>
            <Label>Fim</Label>
            <input
              type="time"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card/60 px-2 text-sm text-text"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando} className="flex-1">
            {enviando ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
