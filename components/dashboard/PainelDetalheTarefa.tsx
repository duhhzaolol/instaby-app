"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Clock,
  MessageSquare,
  History as HistoryIcon,
  Lock,
  Unlock,
  HardDrive,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Send,
  ChevronDown,
} from "lucide-react";
import {
  visualDaCategoriaTarefa,
  PRIORIDADES,
  CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO,
  CATEGORIAS_COM_REVISAO,
} from "@/lib/categoriaTarefaVisual";
import { STATUS_LABEL, campoHistoricoLabel } from "@/lib/tarefas";
import { ChecklistTarefa, type ChecklistItemData } from "@/components/dashboard/ChecklistTarefa";
import { PainelRevisaoConteudo, type VersaoConteudoData } from "@/components/dashboard/PainelRevisaoConteudo";
import { DatePicker } from "@/components/ui/DatePicker";

type Pessoa = { id: string; nome: string; fotoUrl?: string | null };
type Comentario = {
  id: string;
  texto: string;
  createdAt: string;
  usuario: { nome: string; fotoUrl?: string | null } | null;
};
type HistoricoItem = {
  id: string;
  campo: string;
  valorAntigo: string | null;
  valorNovo: string | null;
  createdAt: string;
  usuario: { nome: string } | null;
};
type TarefaDetalhe = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  categoria: string | null;
  prioridade: string | null;
  prazo: string | null;
  link: string | null;
  driveFolderId: string | null;
  clienteId: string | null;
  cliente: { id: string; nome: string; cor: string | null } | null;
  responsavelId: string | null;
  responsavel: Pessoa | null;
  motivoBloqueio: string | null;
  bloqueioResponsavelId: string | null;
  bloqueioResponsavel: Pessoa | null;
  bloqueadaEm: string | null;
  checklist: ChecklistItemData[];
  comentarios: Comentario[];
  historico: HistoricoItem[];
  registroTempoAberto: { id: string; inicio: string } | null;
  // Revisão/aprovação de conteúdo (Etapa 2 v153) — ver PainelRevisaoConteudo.
  statusConteudo: string | null;
  linkPublicacao: string | null;
  publicadoEm: string | null;
  versoes: VersaoConteudoData[];
  // Exceção justificada de vídeo bruto (Etapa 2 v153).
  videoBrutoExcecao: boolean;
  videoBrutoExcecaoMotivo: string | null;
  videoBrutoExcecaoPor: Pessoa | null;
  videoBrutoExcecaoEm: string | null;
};

function horaAtual() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

const STATUS_ORDEM = ["a_fazer", "em_andamento", "bloqueada", "feito"];

// Painel lateral de detalhes da tarefa (Etapa 1 v152) — ponto único de edição
// (título, descrição, responsável, prioridade, prazo, checklist, arquivos,
// comentários, histórico, bloqueio), aberto a partir do Início, Kanban, Agenda e
// ficha do cliente via query param ?tarefa=ID (ver PainelDetalheTarefaHost). Busca
// tudo sozinho em GET /api/tarefas/[id] — nenhuma página precisou mudar a própria
// consulta pra abrir isso.
export function PainelDetalheTarefa({ tarefaId, onClose }: { tarefaId: string; onClose: () => void }) {
  const router = useRouter();
  const [tarefa, setTarefa] = useState<TarefaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [link, setLink] = useState("");
  const [salvandoDetalhes, setSalvandoDetalhes] = useState(false);

  const [statusPendente, setStatusPendente] = useState<string | null>(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [bloqueioResponsavelId, setBloqueioResponsavelId] = useState("");
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);

  const [horaInicioConclusao, setHoraInicioConclusao] = useState(horaAtual());
  const [horaFimConclusao, setHoraFimConclusao] = useState(horaAtual());
  const [salvandoConclusao, setSalvandoConclusao] = useState(false);

  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const [checandoVideo, setChecandoVideo] = useState(false);
  const [temVideoBrutoInfo, setTemVideoBrutoInfo] = useState<boolean | null>(null);

  const [videoBrutoExcecao, setVideoBrutoExcecao] = useState(false);
  const [videoBrutoExcecaoMotivo, setVideoBrutoExcecaoMotivo] = useState("");
  const [salvandoExcecao, setSalvandoExcecao] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setErro(d?.erro || "Não consegui abrir essa tarefa.");
        return;
      }
      const d: TarefaDetalhe = await res.json();
      setTarefa(d);
      setTitulo(d.titulo);
      setDescricao(d.descricao || "");
      setPrioridade(d.prioridade || "");
      setResponsavelId(d.responsavelId || "");
      setData(d.prazo ? d.prazo.slice(0, 10) : "");
      setHora(d.prazo ? d.prazo.slice(11, 16) : "");
      setLink(d.link || "");
      setMotivoBloqueio(d.motivoBloqueio || "");
      setBloqueioResponsavelId(d.bloqueioResponsavelId || "");
      setVideoBrutoExcecao(d.videoBrutoExcecao || false);
      setVideoBrutoExcecaoMotivo(d.videoBrutoExcecaoMotivo || "");
      setStatusPendente(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    fetch("/api/usuarios")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPessoas)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaId]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(dados: Record<string, unknown>): Promise<TarefaDetalhe | null> {
    const res = await fetch(`/api/tarefas/${tarefaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui salvar essa alteração.");
      return null;
    }
    const atualizado = await res.json();
    router.refresh();
    return atualizado;
  }

  function clicarStatus(novo: string) {
    if (!tarefa) return;
    if (novo === tarefa.status) return;
    if (novo === "feito" || novo === "bloqueada") {
      setStatusPendente(novo);
      if (novo === "feito") {
        setHoraInicioConclusao(tarefa.registroTempoAberto ? horaDe(tarefa.registroTempoAberto.inicio) : horaAtual());
        setHoraFimConclusao(horaAtual());
      }
      return;
    }
    setStatusPendente(null);
    patch({ status: novo }).then((atualizado) => {
      if (atualizado) setTarefa((t) => (t ? { ...t, ...atualizado } : t));
    });
  }

  async function confirmarBloqueio() {
    if (!motivoBloqueio.trim()) {
      alert("Descreve o motivo do bloqueio.");
      return;
    }
    setSalvandoBloqueio(true);
    const atualizado = await patch({
      status: "bloqueada",
      motivoBloqueio: motivoBloqueio.trim(),
      bloqueioResponsavelId: bloqueioResponsavelId || null,
    });
    setSalvandoBloqueio(false);
    if (atualizado) {
      setTarefa((t) => (t ? { ...t, ...atualizado } : t));
      setStatusPendente(null);
    }
  }

  async function desbloquear() {
    const atualizado = await patch({ status: "a_fazer" });
    if (atualizado) {
      setTarefa((t) => (t ? { ...t, ...atualizado } : t));
      setMotivoBloqueio("");
      setBloqueioResponsavelId("");
    }
  }

  async function confirmarConclusao(registrarHoras: boolean) {
    if (!tarefa) return;
    setSalvandoConclusao(true);
    const atualizado = await patch({ status: "feito" });
    if (!atualizado) {
      setSalvandoConclusao(false);
      return;
    }
    // Se já tinha cronômetro rodando pra essa tarefa, o servidor já fechou ele
    // sozinho (ver registroTempoFechado) — não cria um segundo registro aqui,
    // exatamente o que evita o duplicado pedido na Etapa 1 item 9.
    const fechouCronometroExistente = !!(atualizado as any).registroTempoFechado;
    if (!fechouCronometroExistente && registrarHoras && horaInicioConclusao && horaFimConclusao) {
      const hoje = new Date().toLocaleDateString("en-CA");
      const resHoras = await fetch("/api/registros-tempo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atividade: tarefa.titulo,
          clienteId: tarefa.clienteId || null,
          inicio: `${hoje}T${horaInicioConclusao}:00-03:00`,
          fim: `${hoje}T${horaFimConclusao}:00-03:00`,
        }),
      });
      if (!resHoras.ok) {
        alert("A tarefa foi marcada como feita, mas não consegui lançar as horas — lança manualmente em Horas.");
      }
    }
    setSalvandoConclusao(false);
    setStatusPendente(null);
    setTarefa((t) => (t ? { ...t, ...atualizado } : t));
  }

  async function salvarDetalhes() {
    setSalvandoDetalhes(true);
    const prazo = data ? `${data}T${hora || "00:00"}:00-03:00` : null;
    const atualizado = await patch({
      titulo,
      descricao: descricao || null,
      prioridade: prioridade || null,
      responsavelId: responsavelId || null,
      prazo,
      link: link || null,
    });
    setSalvandoDetalhes(false);
    if (atualizado) setTarefa((t) => (t ? { ...t, ...atualizado } : t));
  }

  async function verificarVideoBruto() {
    if (!tarefa?.driveFolderId) return;
    setChecandoVideo(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}/video-bruto`);
    const d = await res.json().catch(() => null);
    setTemVideoBrutoInfo(d?.temBruto ?? false);
    setChecandoVideo(false);
  }

  async function salvarExcecaoVideoBruto() {
    if (videoBrutoExcecao && !videoBrutoExcecaoMotivo.trim()) {
      alert("Descreve o motivo da exceção.");
      return;
    }
    setSalvandoExcecao(true);
    const atualizado = await patch({
      videoBrutoExcecao,
      videoBrutoExcecaoMotivo: videoBrutoExcecao ? videoBrutoExcecaoMotivo.trim() : null,
    });
    setSalvandoExcecao(false);
    if (atualizado) setTarefa((t) => (t ? { ...t, ...atualizado } : t));
  }

  async function enviarComentario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoComentario.trim() || !tarefa) return;
    setEnviandoComentario(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novoComentario.trim() }),
    });
    setEnviandoComentario(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui enviar esse comentário.");
      return;
    }
    setNovoComentario("");
    carregar();
  }

  const urgenciaCor =
    tarefa?.prazo && tarefa.status !== "feito" && new Date(tarefa.prazo).getTime() < Date.now() ? "#EF4444" : undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-base shadow-premium-lg sm:w-[26rem]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-text">Detalhes da tarefa</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text">
            <X size={16} />
          </button>
        </div>

        {carregando && <div className="flex-1 p-6 text-sm text-muted">Carregando...</div>}
        {!carregando && erro && <div className="flex-1 p-6 text-sm text-red-400">{erro}</div>}

        {!carregando && tarefa && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {tarefa.cliente && (
              <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tarefa.cliente.cor || "#9CA3AF" }} />
                {tarefa.cliente.nome}
              </p>
            )}

            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${visualDaCategoriaTarefa(tarefa.categoria).cor}1A`,
                  color: visualDaCategoriaTarefa(tarefa.categoria).cor,
                }}
              >
                {(() => {
                  const Icon = visualDaCategoriaTarefa(tarefa.categoria).icone;
                  return <Icon size={14} />;
                })()}
              </div>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="flex-1 rounded-lg border border-transparent bg-transparent px-1 text-sm font-medium text-text outline-none focus:border-border focus:bg-card/60"
              />
            </div>

            {/* Status — pills, igual ao vocabulário do resto do app */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {STATUS_ORDEM.map((s) => (
                <button
                  key={s}
                  onClick={() => clicarStatus(s)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    tarefa.status === s
                      ? s === "feito"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : s === "bloqueada"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : s === "em_andamento"
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                        : "border-white/15 bg-white/5 text-text"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {/* Bloqueio — mostra o form quando já está bloqueada OU quando acabou de clicar em "Bloqueada" */}
            {(tarefa.status === "bloqueada" || statusPendente === "bloqueada") && (
              <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <Lock size={12} /> Motivo do bloqueio
                </p>
                <textarea
                  value={motivoBloqueio}
                  onChange={(e) => setMotivoBloqueio(e.target.value)}
                  rows={2}
                  placeholder="Ex.: esperando aprovação do cliente"
                  className="mb-2 w-full rounded-lg border border-border bg-base px-3 py-2 text-xs text-text outline-none focus:border-red-500/40"
                />
                <label className="mb-1 block text-xs text-muted">Responsável pelo desbloqueio</label>
                <select
                  value={bloqueioResponsavelId}
                  onChange={(e) => setBloqueioResponsavelId(e.target.value)}
                  className="mb-2 h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                >
                  <option value="">Ainda não sei</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={confirmarBloqueio}
                    disabled={salvandoBloqueio}
                    className="h-8 flex-1 rounded-lg bg-red-500 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {salvandoBloqueio ? "Salvando..." : tarefa.status === "bloqueada" ? "Salvar bloqueio" : "Confirmar bloqueio"}
                  </button>
                  {tarefa.status === "bloqueada" && (
                    <button
                      onClick={desbloquear}
                      className="flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
                    >
                      <Unlock size={11} /> Desbloquear
                    </button>
                  )}
                  {statusPendente === "bloqueada" && tarefa.status !== "bloqueada" && (
                    <button
                      onClick={() => setStatusPendente(null)}
                      className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                {tarefa.bloqueadaEm && (
                  <p className="mt-2 text-[11px] text-muted">Bloqueada desde {new Date(tarefa.bloqueadaEm).toLocaleString("pt-BR")}</p>
                )}
              </div>
            )}

            {/* Conclusão — confirma horas antes de marcar feito */}
            {statusPendente === "feito" && (
              <div className="mb-3 rounded-lg border border-accent/20 bg-accent/5 p-3">
                {tarefa.registroTempoAberto ? (
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent">
                    <Clock size={12} /> Tem um cronômetro rodando desde {horaDe(tarefa.registroTempoAberto.inicio)} — vou fechar ele
                    automaticamente ao marcar como feito (sem duplicar registro).
                  </p>
                ) : (
                  <>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-accent">
                      <Clock size={12} /> Quer registrar as horas dessa tarefa agora?
                    </p>
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted">Início</label>
                        <input
                          type="time"
                          value={horaInicioConclusao}
                          onChange={(e) => setHoraInicioConclusao(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted">Fim</label>
                        <input
                          type="time"
                          value={horaFimConclusao}
                          onChange={(e) => setHoraFimConclusao(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmarConclusao(true)}
                    disabled={salvandoConclusao}
                    className="h-8 flex-1 rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-40"
                  >
                    {salvandoConclusao ? "Salvando..." : tarefa.registroTempoAberto ? "Marcar feito" : "Marcar feito e registrar horas"}
                  </button>
                  {!tarefa.registroTempoAberto && (
                    <button
                      onClick={() => confirmarConclusao(false)}
                      disabled={salvandoConclusao}
                      className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
                    >
                      Só marcar feito
                    </button>
                  )}
                  <button onClick={() => setStatusPendente(null)} className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Campos principais */}
            <label className="mb-1 mt-1 block text-xs text-muted">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Detalhes da tarefa..."
              className="mb-3 w-full rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
            />

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Responsável</label>
                <select
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
                >
                  <option value="">Sem responsável</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
                >
                  <option value="">—</option>
                  {PRIORIDADES.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Prazo</label>
                <DatePicker value={data} onChange={setData} placeholder="Sem data" limpavel />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted" style={urgenciaCor ? { color: urgenciaCor } : undefined}>
                  Horário
                </label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
                />
              </div>
            </div>

            <label className="mb-1 block text-xs text-muted">Link / arquivo</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Cole um link (Drive, Canva, etc.)"
              className="mb-3 h-9 w-full rounded-lg border border-border bg-card/60 px-3 text-xs text-text outline-none focus:border-accent/50"
            />

            {tarefa.driveFolderId && CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO.includes((tarefa.categoria || "") as any) && (
              <div className="mb-3 rounded-lg border border-border bg-card/60 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text">
                  <HardDrive size={12} /> Pasta desta semana no Drive
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://drive.google.com/drive/folders/${tarefa.driveFolderId}`}
                    target="_blank"
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text hover:bg-hover"
                  >
                    <ExternalLink size={11} /> Abrir pasta
                  </a>
                  <button
                    type="button"
                    onClick={verificarVideoBruto}
                    disabled={checandoVideo}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-text disabled:opacity-50"
                  >
                    {checandoVideo ? "Verificando..." : "Verificar vídeo bruto"}
                  </button>
                  {temVideoBrutoInfo === true && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 size={12} /> Pronto pra editar
                    </span>
                  )}
                  {temVideoBrutoInfo === false && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <AlertCircle size={12} /> Ainda sem vídeo bruto
                    </span>
                  )}
                </div>

                {/* Exceção justificada (Etapa 2 v153) — pra conteúdo sem gravação
                    própria (ex.: banco de imagens/motion), quando o vídeo bruto de
                    verdade nunca vai existir. */}
                <div className="mt-3 border-t border-border pt-2.5">
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={videoBrutoExcecao}
                      onChange={(e) => setVideoBrutoExcecao(e.target.checked)}
                    />
                    Exceção: esse conteúdo não tem gravação própria
                  </label>
                  {videoBrutoExcecao && (
                    <textarea
                      value={videoBrutoExcecaoMotivo}
                      onChange={(e) => setVideoBrutoExcecaoMotivo(e.target.value)}
                      rows={2}
                      placeholder="Explique o motivo (ex.: reel feito só com banco de imagens)"
                      className="mb-1.5 mt-1.5 w-full rounded-lg border border-border bg-base px-3 py-2 text-xs text-text outline-none focus:border-accent/50"
                    />
                  )}
                  <button
                    type="button"
                    onClick={salvarExcecaoVideoBruto}
                    disabled={salvandoExcecao}
                    className="mt-1.5 h-8 rounded-lg border border-border px-2.5 text-xs text-text hover:bg-hover disabled:opacity-50"
                  >
                    {salvandoExcecao ? "Salvando..." : "Salvar exceção"}
                  </button>
                  {tarefa.videoBrutoExcecao && (
                    <p className="mt-1.5 text-[11px] text-amber-400">
                      Exceção registrada{tarefa.videoBrutoExcecaoPor ? ` por ${tarefa.videoBrutoExcecaoPor.nome}` : ""}
                      {tarefa.videoBrutoExcecaoEm ? ` em ${new Date(tarefa.videoBrutoExcecaoEm).toLocaleString("pt-BR")}` : ""}.
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={salvarDetalhes}
              disabled={salvandoDetalhes}
              className="mb-4 h-9 w-full rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-50"
            >
              {salvandoDetalhes ? "Salvando..." : "Salvar alterações"}
            </button>

            {/* Checklist */}
            <div className="mb-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-text">Sub-passos</p>
              <ChecklistTarefa tarefaId={tarefa.id} itens={tarefa.checklist} />
            </div>

            {/* Revisão/aprovação de conteúdo (Etapa 2 v153) — só reel/arte */}
            {CATEGORIAS_COM_REVISAO.includes((tarefa.categoria || "") as any) && (
              <PainelRevisaoConteudo tarefa={tarefa} patch={patch} recarregar={carregar} />
            )}

            {/* Comentários internos */}
            <div className="mb-4 border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text">
                <MessageSquare size={12} /> Comentários internos
              </p>
              <div className="mb-2 flex flex-col gap-2">
                {tarefa.comentarios.length === 0 && <p className="text-xs text-muted">Nenhum comentário ainda.</p>}
                {tarefa.comentarios.map((c) => (
                  <div key={c.id} className="rounded-lg bg-card/60 px-3 py-2">
                    <p className="mb-0.5 flex items-center justify-between text-[11px] text-muted">
                      <span className="font-medium text-text/80">{c.usuario?.nome || "Alguém"}</span>
                      <span>{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                    </p>
                    <p className="whitespace-pre-wrap text-xs text-text">{c.texto}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={enviarComentario} className="flex items-center gap-1.5">
                <input
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escrever um comentário..."
                  disabled={enviandoComentario}
                  className="h-9 w-full flex-1 rounded-lg border border-border bg-card/60 px-3 text-xs text-text outline-none focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={enviandoComentario || !novoComentario.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>

            {/* Histórico */}
            <div className="border-t border-border pt-3">
              <button
                onClick={() => setHistoricoAberto((v) => !v)}
                className="mb-2 flex w-full items-center justify-between text-xs font-medium text-text"
              >
                <span className="flex items-center gap-1.5">
                  <HistoryIcon size={12} /> Histórico de alterações ({tarefa.historico.length})
                </span>
                <ChevronDown size={13} className={`text-muted transition-transform ${historicoAberto ? "rotate-180" : ""}`} />
              </button>
              {historicoAberto && (
                <div className="flex flex-col gap-1.5">
                  {tarefa.historico.length === 0 && <p className="text-xs text-muted">Nenhuma alteração registrada ainda.</p>}
                  {tarefa.historico.map((h) => (
                    <p key={h.id} className="text-[11px] text-muted">
                      <span className="text-text/70">{h.usuario?.nome || "Alguém"}</span> mudou{" "}
                      <span className="text-text/70">{campoHistoricoLabel(h.campo)}</span>
                      {h.valorAntigo !== null || h.valorNovo !== null ? (
                        <>
                          {" "}
                          de "{h.valorAntigo ?? "—"}" pra "{h.valorNovo ?? "—"}"
                        </>
                      ) : null}{" "}
                      · {new Date(h.createdAt).toLocaleString("pt-BR")}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
