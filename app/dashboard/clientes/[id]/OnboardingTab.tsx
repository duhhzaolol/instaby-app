"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Plus, Trash2, Clock, ExternalLink, Ban } from "lucide-react";
import { RESPONSAVEIS_ONBOARDING } from "@/lib/onboardingTemplate";

export type ItemOnboardingData = {
  id: string;
  titulo: string;
  responsavel: string;
  status: string;
  observacao: string | null;
  dataConclusao: string | null;
};

export type OnboardingData = {
  id: string;
  dataInicio: string;
  status: string;
  itens: ItemOnboardingData[];
};

export default function OnboardingTab({ clienteId, onboarding }: { clienteId: string; onboarding: OnboardingData | null }) {
  const router = useRouter();
  const [iniciando, setIniciando] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [lancandoTempoId, setLancandoTempoId] = useState<string | null>(null);
  const [minutos, setMinutos] = useState("");

  async function iniciar() {
    setIniciando(true);
    await fetch(`/api/clientes/${clienteId}/onboarding`, { method: "POST" });
    setIniciando(false);
    router.refresh();
  }

  async function mudarStatus(id: string, status: string) {
    await fetch(`/api/itens-onboarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function mudarResponsavel(id: string, responsavel: string) {
    await fetch(`/api/itens-onboarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsavel }),
    });
    router.refresh();
  }

  async function excluirItem(id: string) {
    if (!confirm("Excluir esse item?")) return;
    await fetch(`/api/itens-onboarding/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function adicionarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!novoTitulo.trim() || !onboarding) return;
    setAdicionando(true);
    await fetch(`/api/onboarding/${onboarding.id}/itens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: novoTitulo }),
    });
    setAdicionando(false);
    setNovoTitulo("");
    router.refresh();
  }

  async function lancarTempo(id: string) {
    const min = parseInt(minutos);
    if (!min || min <= 0) return;
    await fetch(`/api/itens-onboarding/${id}/tempo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutos: min }),
    });
    setLancandoTempoId(null);
    setMinutos("");
    router.refresh();
  }

  if (!onboarding) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 py-12 text-center">
        <p className="mb-3 text-sm text-muted">Esse cliente ainda não tem onboarding iniciado.</p>
        <button
          onClick={iniciar}
          disabled={iniciando}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {iniciando ? "Criando..." : "Iniciar onboarding"}
        </button>
      </div>
    );
  }

  const concluidos = onboarding.itens.filter((i) => i.status === "concluido").length;
  const dias = Math.max(0, Math.round((Date.now() - new Date(onboarding.dataInicio).getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="text-xs text-muted">Iniciado há</p>
          <p className="text-lg font-medium text-text">{dias} dia(s)</p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="text-xs text-muted">Checklist</p>
          <p className="text-lg font-medium text-text">
            {concluidos}/{onboarding.itens.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-3.5">
          <p className="text-xs text-muted">Status</p>
          <p className="text-lg font-medium text-text">{onboarding.status === "concluido" ? "Concluído" : "Em andamento"}</p>
        </div>
      </div>

      <Link
        href={`/onboarding/${onboarding.id}`}
        target="_blank"
        className="mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/60 py-2.5 text-sm text-text hover:bg-hover"
      >
        <ExternalLink size={14} /> Ver página pra compartilhar com o cliente
      </Link>

      <div className="mb-4 flex flex-col gap-2">
        {onboarding.itens.map((item) => (
          <div key={item.id} className="rounded-xl border border-border bg-card/60 p-3.5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <button
                onClick={() => mudarStatus(item.id, item.status === "concluido" ? "pendente" : "concluido")}
                className="flex flex-1 items-start gap-2 text-left"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    item.status === "concluido"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : item.status === "bloqueado"
                      ? "border-amber-500 text-amber-500"
                      : "border-border"
                  }`}
                >
                  {item.status === "concluido" && <Check size={11} />}
                  {item.status === "bloqueado" && <Ban size={10} />}
                </span>
                <span className={`text-sm ${item.status === "concluido" ? "text-muted line-through" : "text-text"}`}>
                  {item.titulo}
                </span>
              </button>
              <button onClick={() => excluirItem(item.id)} className="text-muted hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="ml-6 flex flex-wrap items-center gap-2">
              <select
                value={item.responsavel}
                onChange={(e) => mudarResponsavel(item.id, e.target.value)}
                className="h-7 rounded-lg border border-border bg-base px-2 text-[11px] text-muted"
              >
                {RESPONSAVEIS_ONBOARDING.map((r) => (
                  <option key={r.valor} value={r.valor}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => mudarStatus(item.id, item.status === "bloqueado" ? "pendente" : "bloqueado")}
                className={`h-7 rounded-lg border px-2 text-[11px] ${
                  item.status === "bloqueado" ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-border text-muted"
                }`}
              >
                {item.status === "bloqueado" ? "Bloqueado" : "Marcar bloqueado"}
              </button>

              {lancandoTempoId === item.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    autoFocus
                    value={minutos}
                    onChange={(e) => setMinutos(e.target.value)}
                    placeholder="minutos"
                    className="h-7 w-20 rounded-lg border border-border bg-base px-2 text-[11px] text-text"
                  />
                  <button onClick={() => lancarTempo(item.id)} className="h-7 rounded-lg bg-accent px-2 text-[11px] text-white">
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLancandoTempoId(item.id)}
                  className="flex h-7 items-center gap-1 rounded-lg border border-border px-2 text-[11px] text-muted hover:text-text"
                >
                  <Clock size={10} /> Lançar tempo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={adicionarItem} className="flex gap-2">
        <input
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          placeholder="Adicionar item ao checklist"
          className="h-10 flex-1 rounded-xl border border-border bg-card/60 px-3 text-sm text-text"
        />
        <button
          type="submit"
          disabled={adicionando || !novoTitulo.trim()}
          className="flex h-10 items-center gap-1 rounded-xl bg-accent px-3 text-sm text-white disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </form>
    </div>
  );
}
