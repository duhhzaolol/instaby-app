"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Send, UserPlus, ExternalLink, X } from "lucide-react";

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
  const painelRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

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
    if (!aberto) return;
    const painel = painelRef.current;
    if (!painel) return;
    const nativo = typeof painel.showPopover === "function";
    function limparPaineis() {
      setAberto(false);
      setRespondendoId(null);
      setAtribuindoId(null);
      setAdiandoId(null);
    }
    function aoAlternar() {
      if (nativo && !painel?.matches(":popover-open")) limparPaineis();
    }
    function aoClicarFora(e: PointerEvent) {
      if (!painel?.contains(e.target as Node) && !botaoRef.current?.contains(e.target as Node)) limparPaineis();
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        limparPaineis();
        botaoRef.current?.focus();
      }
    }
    painel.addEventListener("toggle", aoAlternar);
    if (nativo) painel.showPopover();
    fecharRef.current?.focus();
    document.addEventListener("pointerdown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      painel.removeEventListener("toggle", aoAlternar);
      if (nativo && painel.matches(":popover-open")) painel.hidePopover();
      document.removeEventListener("pointerdown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar, true);
    };
  }, [aberto]);

  function alternarAberto() {
    if (!aberto) {
      carregar();
      if (pessoas.length === 0) {
        fetch("/api/usuarios")
          .then((r) => (r.ok ? r.json() : []))
          .then(setPessoas)
          .catch(() => {});
      }
    }
    setAberto((v) => !v);
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

  const popover = typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype ? { popover: "auto" as const } : {};
  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={alternarAberto}
        title="Notificações"
        aria-label={naoLidas ? `Notificações, ${naoLidas} não lidas` : "Notificações"}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls={aberto ? "notificacoes-topbar" : undefined}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-hover hover:text-text"
      >
        <Bell size={18} aria-hidden="true" />
        {naoLidas > 0 && (
          <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && createPortal(
        <div ref={painelRef} id="notificacoes-topbar" role="dialog" aria-labelledby="titulo-notificacoes" {...popover} className="fixed inset-x-4 bottom-auto top-36 z-50 m-0 max-h-[calc(100dvh-10rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-4 text-text shadow-premium-lg lg:left-auto lg:right-6 lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:w-96">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 id="titulo-notificacoes" className="text-sm font-semibold">Notificações</h2>
            <button ref={fecharRef} type="button" aria-label="Fechar notificações" onClick={() => { setAberto(false); botaoRef.current?.focus(); }} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"><X size={18} aria-hidden="true" /></button>
          </div>
          {notificacoes.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">Nenhuma notificação por aqui.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {notificacoes.map((n) => {
                const acao = acaoPrincipal(n.tipo);
                return (
                  <div
                    key={n.id}
                    className="py-3"
                  >
                    <button type="button" onClick={() => abrir(n)} className="block min-h-11 w-full rounded-lg text-left transition-colors hover:bg-hover">
                      <p className="flex items-start justify-between gap-2 text-sm font-medium text-text">
                        <span className="min-w-0 flex-1">
                          {!n.lidaEm && <span aria-label="Não lida" className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />}{n.titulo}
                          {n.contador > 1 && <span className="ml-1 text-muted">· {n.contador}x</span>}
                        </span>
                        <span className="shrink-0 text-[10px] font-normal text-muted">{tempoRelativo(n.atualizadoEm)}</span>
                      </p>
                      {n.corpo && <p className="mt-1 line-clamp-2 text-xs text-muted">{n.corpo}</p>}
                    </button>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {acao && (
                        <button
                          onClick={() =>
                            acao.label === "Responder"
                              ? setRespondendoId((id) => (id === n.id ? null : n.id))
                              : abrir(n)
                          }
                          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition-colors hover:bg-hover hover:text-text"
                        >
                          <acao.icone size={13} aria-hidden="true" /> {acao.label}
                        </button>
                      )}
                      {n.tarefaId && (
                        <button
                          onClick={() => setAtribuindoId((id) => (id === n.id ? null : n.id))}
                          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition-colors hover:bg-hover hover:text-text"
                        >
                          <UserPlus size={13} aria-hidden="true" /> Atribuir
                        </button>
                      )}
                      <button
                        onClick={() => setAdiandoId((id) => (id === n.id ? null : n.id))}
                        className="flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition-colors hover:bg-hover hover:text-text"
                      >
                        <Clock size={13} aria-hidden="true" /> Adiar
                      </button>
                      <button
                        onClick={() => marcarLida(n, !n.lidaEm)}
                        title={n.lidaEm ? "Marcar como não lida" : "Marcar como lida"}
                        className="ml-auto flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition-colors hover:bg-hover hover:text-text"
                      >
                        <Check size={13} aria-hidden="true" /> {n.lidaEm ? "Não lida" : "Lida"}
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
                            Esta resposta substitui o comentário anterior da agência no relatório.
                          </p>
                        )}
                        <label htmlFor={`resposta-${n.id}`} className="mb-1.5 block text-xs font-medium text-muted">Resposta</label>
                        <div className="flex items-center gap-1.5">
                        <input
                          id={`resposta-${n.id}`}
                          name="resposta"
                          autoComplete="off"
                          autoFocus
                          value={textoResposta}
                          onChange={(e) => setTextoResposta(e.target.value)}
                          placeholder="Escreva sua resposta…"
                          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-inset px-3 text-base text-text placeholder:text-muted"
                        />
                        <button
                          type="submit"
                          aria-label="Enviar resposta"
                          disabled={enviando || !textoResposta.trim()}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:brightness-110 disabled:opacity-50"
                        >
                          <Send size={16} aria-hidden="true" />
                        </button>
                        </div>
                      </form>
                    )}

                    {atribuindoId === n.id && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <select
                          aria-label="Responsável pela tarefa"
                          onChange={(e) => e.target.value && atribuir(n, e.target.value)}
                          disabled={enviando}
                          defaultValue=""
                          className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-inset px-3 text-base text-text"
                        >
                          <option value="" disabled>
                            Selecionar responsável
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
                            className="min-h-11 rounded-lg border border-border px-2.5 text-xs text-muted transition-colors hover:bg-hover hover:text-text"
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
        </div>, document.querySelector(".tema-painel") || document.body
      )}
    </>
  );
}
