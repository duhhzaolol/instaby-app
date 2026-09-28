"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Square, Play } from "lucide-react";

type Cliente = { id: string; nome: string; cor: string | null };

type RegistroAtual = {
  id: string;
  clienteId: string | null;
  cliente: { nome: string } | null;
  atividade: string;
  inicio: string;
} | null;

function formatarDuracao(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Cronômetro da barra do topo (redesign v144, Parte 1) — em cima do
// RegistroTempo que já existia (usado em Horas), sem nenhum campo novo no
// banco. "Iniciar" cria um registro sem "fim"; "parar" preenche o "fim".
export function CronometroTopbar({ clientes }: { clientes: Cliente[] }) {
  const [registro, setRegistro] = useState<RegistroAtual>(null);
  const [carregado, setCarregado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [atividade, setAtividade] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  // Busca só uma vez ao montar (troca de aba/reload) se já tinha algo rodando.
  useEffect(() => {
    fetch("/api/registros-tempo/atual")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRegistro(data))
      .catch(() => {})
      .finally(() => setCarregado(true));
  }, []);

  // Relógio correndo só enquanto tem registro aberto.
  useEffect(() => {
    if (!registro) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [registro]);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  async function iniciar(e: React.FormEvent) {
    e.preventDefault();
    if (!atividade.trim()) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteId || null,
          atividade: atividade.trim(),
          inicio: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setRegistro(await res.json());
        setAberto(false);
        setAtividade("");
        setClienteId("");
      }
    } finally {
      setSalvando(false);
    }
  }

  async function parar() {
    if (!registro) return;
    const idParaParar = registro.id;
    setRegistro(null); // otimista — não trava esperando resposta pra "parecer" parado
    await fetch(`/api/registros-tempo/${idParaParar}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fim: new Date().toISOString() }),
    }).catch(() => {});
  }

  if (!carregado) {
    return <div className="hidden h-9 w-9 sm:block" />; // evita "pulo" de layout enquanto checa se tem algo rodando
  }

  if (registro) {
    const segundos = Math.max(0, Math.floor((agora - new Date(registro.inicio).getTime()) / 1000));
    return (
      <div className="flex h-9 items-center gap-2 rounded-xl bg-accent/15 pl-3 pr-1.5 text-accent-text">
        <span className="hidden max-w-[160px] truncate text-xs font-medium sm:inline">
          {registro.atividade}
          {registro.cliente && <span className="text-accent-text/70"> · {registro.cliente.nome}</span>}
        </span>
        <span className="fonte-valores text-xs tabular-nums">{formatarDuracao(segundos)}</span>
        <button
          onClick={parar}
          title="Parar cronômetro"
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:brightness-110"
        >
          <Square size={10} fill="currentColor" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        title="Iniciar cronômetro"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted transition-colors hover:bg-hover hover:text-text"
      >
        <Clock size={16} />
      </button>

      {aberto && (
        <form
          onSubmit={iniciar}
          className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-border bg-card p-3 shadow-premium-lg"
        >
          <p className="mb-2.5 text-sm font-medium text-text">Iniciar cronômetro</p>
          <input
            autoFocus
            required
            value={atividade}
            onChange={(e) => setAtividade(e.target.value)}
            placeholder="Atividade (ex: Edição)"
            className="mb-2 h-9 w-full rounded-lg border border-border bg-inset px-3 text-sm text-text outline-none focus:border-accent/50"
          />
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="mb-3 h-9 w-full rounded-lg border border-border bg-inset px-2.5 text-sm text-text"
          >
            <option value="">Sem cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={salvando || !atividade.trim()}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-semibold text-white disabled:opacity-40"
          >
            <Play size={13} fill="currentColor" /> {salvando ? "Iniciando..." : "Iniciar"}
          </button>
        </form>
      )}
    </div>
  );
}
