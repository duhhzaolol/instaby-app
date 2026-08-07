"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type RegistroTempoData = {
  id: string;
  atividade: string;
  inicio: string;
  fim: string | null;
  clienteNome?: string | null;
};

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function duracaoHoras(inicio: string, fim: string | null) {
  if (!fim) return null;
  const ms = new Date(fim).getTime() - new Date(inicio).getTime();
  return Math.max(0, ms / 1000 / 60 / 60);
}

export function RegistroTempoRow({ registro, index }: { registro: RegistroTempoData; index: number }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [inicio, setInicio] = useState(formatarHora(registro.inicio));
  const [fim, setFim] = useState(registro.fim ? formatarHora(registro.fim) : "");
  const [salvando, setSalvando] = useState(false);

  const duracao = duracaoHoras(registro.inicio, registro.fim);
  const dataBase = registro.inicio.slice(0, 10);

  async function salvar() {
    setSalvando(true);
    await fetch(`/api/registros-tempo/${registro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inicio: `${dataBase}T${inicio}:00`,
        fim: fim ? `${dataBase}T${fim}:00` : null,
      }),
    });
    setSalvando(false);
    setEditando(false);
    router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir esse registro de horas?")) return;
    await fetch(`/api/registros-tempo/${registro.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editando) {
    return (
      <Card index={index} hoverable={false} className="p-3.5">
        <p className="mb-2 text-sm text-text">{registro.atividade}</p>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <input
            type="time"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="h-9 rounded-lg border border-border bg-base px-2 text-sm text-text"
          />
          <input
            type="time"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="h-9 rounded-lg border border-border bg-base px-2 text-sm text-text"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={salvar} disabled={salvando} className="flex-1">
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card index={index} hoverable={false} className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm text-text">
          {registro.atividade}
          {registro.clienteNome && (
            <span className="ml-2 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
              {registro.clienteNome}
            </span>
          )}
        </p>
        <p className="text-xs text-muted">
          {formatarHora(registro.inicio)}
          {registro.fim ? ` – ${formatarHora(registro.fim)}` : " – em andamento"}
          {duracao !== null && ` · ${duracao.toFixed(1)}h`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setEditando(true)} className="text-muted hover:text-text">
          <Pencil size={13} />
        </button>
        <button onClick={excluir} className="text-muted hover:text-red-400">
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );
}
