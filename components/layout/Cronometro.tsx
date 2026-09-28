"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";

type Cliente = { id: string; nome: string; cor: string | null };

type RegistroAtivo = {
  id: string;
  atividade: string;
  inicio: string;
  cliente: { nome: string } | null;
};

// Mesmas sugestões do formulário de Horas (NovoRegistroTempoForm).
const ATIVIDADES = ["Captação", "Edição", "Reunião", "Planejamento", "Tráfego pago", "Relatório"];

function formatarDecorrido(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// Cronômetro da barra do topo (redesign fase 1). A ideia é a hora ser lançada
// enquanto a pessoa trabalha, em vez de lembrar e preencher depois. Por baixo é
// o mesmo RegistroTempo da tela de Horas: começar cria um registro sem fim,
// parar preenche o fim — então tudo aparece em Horas normalmente.
export function Cronometro({ clientes }: { clientes: Cliente[] }) {
  const router = useRouter();
  const [registro, setRegistro] = useState<RegistroAtivo | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const [aberto, setAberto] = useState(false);
  const [atividade, setAtividade] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/registros-tempo/ativo")
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => setRegistro(r))
      .catch(() => {
        // sem cronômetro não trava nada — a pessoa ainda lança em Horas
      })
      .finally(() => setCarregado(true));
  }, []);

  useEffect(() => {
    if (!registro) return;
    setAgora(Date.now());
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [registro]);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    }
    function aoApertarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoApertarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoApertarTecla);
    };
  }, [aberto]);

  async function comecar(e: React.FormEvent) {
    e.preventDefault();
    if (!atividade.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atividade: atividade.trim(),
          clienteId: clienteId || null,
          inicio: new Date().toISOString(),
          fim: null,
        }),
      });
      if (res.ok) {
        setRegistro(await res.json());
        setAberto(false);
        setAtividade("");
        setClienteId("");
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  async function parar() {
    if (!registro) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/registros-tempo/${registro.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fim: new Date().toISOString() }),
      });
      if (res.ok) {
        setRegistro(null);
        router.refresh();
      }
    } finally {
      setEnviando(false);
    }
  }

  // Evita o botão "Iniciar" piscar antes de saber se já tem um rodando.
  if (!carregado) return <div className="hidden h-9 w-[150px] sm:block" aria-hidden />;

  if (registro) {
    return (
      <div className="flex h-9 items-center gap-2.5 rounded-[10px] border border-accent/25 bg-accent/10 pl-3 pr-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_0_4px_rgba(230,57,70,0.2)]" />
        <span className="hidden max-w-[260px] truncate text-[12.5px] lg:block">
          <span className="font-semibold text-text">{registro.atividade}</span>
          {registro.cliente && <span className="text-muted"> · {registro.cliente.nome}</span>}
        </span>
        <span className="font-numero text-[13px] font-semibold text-red-300" aria-label="Tempo decorrido">
          {formatarDecorrido(agora - new Date(registro.inicio).getTime())}
        </span>
        <button
          onClick={parar}
          disabled={enviando}
          aria-label="Parar cronômetro"
          title="Parar e salvar em Horas"
          className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent transition hover:brightness-110 disabled:opacity-50"
        >
          <span className="h-[9px] w-[9px] rounded-[2px] bg-white" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex h-9 items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-[13px] font-semibold text-muted transition-colors hover:bg-hover hover:text-text"
      >
        <PlayCircle size={16} />
        <span className="hidden sm:inline">Iniciar cronômetro</span>
      </button>

      {aberto && (
        <form
          onSubmit={comecar}
          className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-border bg-card p-3 shadow-premium-lg"
        >
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="cronometro-atividade">
            O que você vai fazer?
          </label>
          <input
            id="cronometro-atividade"
            autoFocus
            required
            list="cronometro-atividades"
            value={atividade}
            onChange={(e) => setAtividade(e.target.value)}
            placeholder="Edição, Captação..."
            className="mb-2.5 h-10 w-full rounded-[10px] border border-border bg-inset px-3 text-sm text-text outline-none focus:border-accent/50"
          />
          <datalist id="cronometro-atividades">
            {ATIVIDADES.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>

          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="cronometro-cliente">
            Cliente
          </label>
          <select
            id="cronometro-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="mb-3 h-10 w-full rounded-[10px] border border-border bg-inset px-3 text-sm text-text"
          >
            <option value="">Sem cliente / interno</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={enviando || !atividade.trim()}
            className="h-10 w-full rounded-[10px] bg-accent text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {enviando ? "Começando..." : "Começar"}
          </button>
        </form>
      )}
    </div>
  );
}
