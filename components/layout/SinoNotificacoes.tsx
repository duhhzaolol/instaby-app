"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Send, UserPlus, ExternalLink } from "lucide-react";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string | null;
  link: string | null;
  tarefaId: string | null;
  relatorioId: string | null;
  contador: number;
  lidaEm: string | null;
  adiadaAte: string | null;
  createdAt: string;
  atualizadoEm: string;
};

type Pessoa = { id: string; nome: string };

function tempoRelativo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// Rótulo/ícone da ação principal de cada tipo — vocabulário pedido na Etapa 1
// item 6 (abrir, responder, revisar, atribuir). "Abrir" é sempre a ação do clique
// na própria linha; as outras aparecem como atalho quando fazem sentido pro tipo.
function acaoPrincipal(tipo: string): { label: string; icone: typeof Send } | null {
  if (tipo === "comentario_tarefa" || tipo === "comentario_relatorio") return { label: "Responder", icone: Send };
  if (tipo === "tarefa_bloqueada") return { label: "Revisar", icone: ExternalLink };
  return null;
}

function presetsAdiar() {
  const agora = new Date();
  const em1h = new Date(agora.getTime() + 60 * 60 * 1000);
  const amanha = new Date(agora);
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(9, 0, 0, 0);
  const semanaQueVem = new Date(agora);
  semanaQueVem.setDate(semanaQueVem.getDate() + 7);
  semanaQueVem.setHours(9, 0, 0, 0);
  return [
    { label: "1 hora", ate: em1h },
    { label: "Amanhã de manhã", ate: amanha },
    { label: "Semana que vem", ate: semanaQueVem },
  ];
}

// Sino de notificações (Etapa 1 v152) — substitui o botão decorativo que existia
// antes. Busca em GET /api/notificacoes (sempre só as da própria pessoa, nunca de
// outra) e re-busca a cada 30s + toda vez que o dropdown abre.
export function SinoNotificacoes() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [textoResposta, setTextoResposta] = useState("");
  const [atribuindoId, setAtribuindoId] = useState<string | null>(null);
  const [adiandoId, setAdiandoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function carregar() {
    try {
      const res = await fetch("/api/notificacoes");
      if (!res.ok) return;
      const d = await res.json();
      setNotificacoes(d.notificacoes || []);
      setNaoLidas(d.naoLidas || 0);
    } catch {
      // conveniência, não trava a tela se falhar
    }
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
        setRespondendoId(null);
        setAtribuindoId(null);
        setAdiandoId(null);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function alternarAberto() {
    setAberto((v) => {
      const novo = !v;
      if (novo) {
        carregar();
        if (pessoas.length === 0) {
          fetch("/api/usuarios")
            .then((r) => (r.ok ? r.json() : []))
            .then(setPessoas)
            .catch(() => {});
        }
      }
      return novo;
    });
  }

  async function marcarLida(n: Notificacao, lida: boolean) {
    setNotificacoes((prev) => prev.map((x) => (x.id === n.id ? { ...x, lidaEm: lida ? new Date().toISOString() : null } : x)));
    setNaoLidas((c) => Math.max(0, c + (lida ? -1 : 1)));
    await fetch(`/api/notificacoes/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lida }),
    }).catch(() => {});
  }

  function abrir(n: Notificacao) {
    if (!n.lidaEm) marcarLida(n, true);
    setAberto(false);
    if (n.link) router.push(n.link);
  }

  async function adiar(n: Notificacao, ate: Date) {
    setAdiandoId(null);
    setNotificacoes((prev) => prev.filter((x) => x.id !== n.id));
    setNaoLidas((c) => (n.lidaEm ? c : Math.max(0, c - 1)));
    await fetch(`/api/notificacoes/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adiarAte: ate.toISOString() }),
    }).catch(() => {});
  }

  async function enviarResposta(n: Notificacao) {
    const texto = textoResposta.trim();
    if (!texto) return;
    setEnviando(true);
    // Comentário de tarefa vira mais uma linha na conversa (POST); comentário de
    // relatório é a resposta da agência naquele período (PATCH — mesmo campo
    // único editável em RelatorioCard, Etapa 1 item 7).
    const res = n.tarefaId
      ? await fetch(`/api/tarefas/${n.tarefaId}/comentarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto }),
        })
      : n.relatorioId
      ? await fetch(`/api/relatorios/${n.relatorioId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comentarioAgencia: texto }),
        })
      : null;
    setEnviando(false);
    if (!res || !res.ok) {
      alert("Não consegui enviar essa resposta.");
      return;
    }
    setTextoResposta("");
    setRespondendoId(null);
    marcarLida(n, true);
  }

  async function atribuir(n: Notificacao, usuarioId: string) {
    if (!n.tarefaId || !usuarioId) return;
    setEnviando(true);
    const res = await fetch(`/api/tarefas/${n.tarefaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsavelId: usuarioId }),
    });
    setEnviando(false);
    if (!res.ok) {
      alert("Não consegui atribuir essa tarefa.");
      return;
    }
    setAtribuindoId(null);
    marcarLida(n, true);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={alternarAberto}
        title="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted transition-colors hover:bg-hover hover:text-text"
      >
        <Bell size={16} />
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-11 z-30 max-h-[70vh] w-80 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-premium-lg sm:w-96">
          {notificacoes.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">Nenhuma notificação por aqui.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {notificacoes.map((n) => {
                const acao = acaoPrincipal(n.tipo);
                return (
                  <div
                    key={n.id}
                    className={`rounded-lg px-2.5 py-2 transition-colors ${n.lidaEm ? "opacity-60" : ""} hover:bg-hover`}
                  >
                    <button onClick={() => abrir(n)} className="block w-full text-left">
                      <p className="flex items-start justify-between gap-2 text-xs font-medium text-text">
                        <span className="min-w-0 flex-1">
                          {n.titulo}
                          {n.contador > 1 && <span className="ml-1 text-muted">· {n.contador}x</span>}
                        </span>
                        <span className="shrink-0 text-[10px] font-normal text-muted">{tempoRelativo(n.atualizadoEm)}</span>
                      </p>
                      {n.corpo && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{n.corpo}</p>}
                    </button>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {acao && (
                        <button
                          onClick={() =>
                            acao.label === "Responder"
                              ? setRespondendoId((id) => (id === n.id ? null : n.id))
                              : abrir(n)
                          }
                          className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-text"
                        >
                          <acao.icone size={10} /> {acao.label}
                        </button>
                      )}
                      {n.tarefaId && (
                        <button
                          onClick={() => setAtribuindoId((id) => (id === n.id ? null : n.id))}
                          className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-text"
                        >
                          <UserPlus size={10} /> Atribuir
                        </button>
                      )}
                      <button
                        onClick={() => setAdiandoId((id) => (id === n.id ? null : n.id))}
                        className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-text"
                      >
                        <Clock size={10} /> Adiar
                      </button>
                      <button
                        onClick={() => marcarLida(n, !n.lidaEm)}
                        title={n.lidaEm ? "Marcar como não lida" : "Marcar como lida"}
                        className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted hover:text-text"
                      >
                        <Check size={10} /> {n.lidaEm ? "Não lida" : "Lida"}
                      </button>
                    </div>

                    {respondendoId === n.id && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          enviarResposta(n);
                        }}
                        className="mt-1.5"
                      >
                        {n.tipo === "comentario_relatorio" && (
                          <p className="mb-1 text-[10px] text-muted">
                            Isso vira o comentário da agência nesse relatório (substitui o anterior, se já tinha).
                          </p>
                        )}
                        <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={textoResposta}
                          onChange={(e) => setTextoResposta(e.target.value)}
                          placeholder="Responder..."
                          className="h-7 w-full flex-1 rounded-md border border-border bg-base px-2 text-[11px] text-text outline-none focus:border-accent/50"
                        />
                        <button
                          type="submit"
                          disabled={enviando || !textoResposta.trim()}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-white disabled:opacity-40"
                        >
                          <Send size={11} />
                        </button>
                        </div>
                      </form>
                    )}

                    {atribuindoId === n.id && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <select
                          onChange={(e) => e.target.value && atribuir(n, e.target.value)}
                          disabled={enviando}
                          defaultValue=""
                          className="h-7 w-full flex-1 rounded-md border border-border bg-base px-1.5 text-[11px] text-text"
                        >
                          <option value="" disabled>
                            Atribuir pra...
                          </option>
                          {pessoas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {adiandoId === n.id && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {presetsAdiar().map((p) => (
                          <button
                            key={p.label}
                            onClick={() => adiar(n, p.ate)}
                            className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted hover:border-accent/40 hover:text-text"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
