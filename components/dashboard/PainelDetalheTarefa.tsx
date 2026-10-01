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
  GitBranch,
  Repeat,
  Plus,
  Trash2,
} from "lucide-react";
import {
  visualDaCategoriaTarefa,
  CATEGORIAS_TAREFA,
  PRIORIDADES,
  CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO,
  CATEGORIAS_COM_REVISAO,
} from "@/lib/categoriaTarefaVisual";
import { STATUS_LABEL, campoHistoricoLabel } from "@/lib/tarefas";
import { ChecklistTarefa, type ChecklistItemData } from "@/components/dashboard/ChecklistTarefa";
import { PainelRevisaoConteudo, type VersaoConteudoData } from "@/components/dashboard/PainelRevisaoConteudo";
import { DatePicker } from "@/components/ui/DatePicker";
import { camposPrazo } from "@/lib/agenda";

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
// Dependências entre tarefas (Etapa 4 v158) — "ligada" é a outra tarefa do
// vínculo; "id" é o id do VÍNCULO em si (DependenciaTarefa), usado pra remover.
type TarefaLigada = { id: string; titulo: string; prazo: string | null; status: string };
type DependenciaLigacao = { id: string; dependeDe: TarefaLigada };
type BloqueioLigacao = { id: string; tarefa: TarefaLigada };
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
  cliente: { id: string; nome: string; cor: string | null; driveLogotiposFolderId: string | null } | null;
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
  publicacaoSugeridaEm: string | null;
  versoes: VersaoConteudoData[];
  // Exceção justificada de vídeo bruto (Etapa 2 v153).
  videoBrutoExcecao: boolean;
  videoBrutoExcecaoMotivo: string | null;
  videoBrutoExcecaoPor: Pessoa | null;
  videoBrutoExcecaoEm: string | null;
  // Capacidade/dependências (Etapa 4 v158).
  estimativaHoras: number | null;
  dependeDe: DependenciaLigacao[];
  bloqueiaDe: BloqueioLigacao[];
  rotinaGerada: { id: string; mes: number; ano: number } | null;
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

// Mesma lista usada em app/dashboard/clientes/[id]/EntregasTab.tsx — só pro
// rótulo do badge "gerada automaticamente" (Etapa 4 v158).
const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Painel lateral de detalhes da tarefa (Etapa 1 v152) — ponto único de edição
// (título, descrição, responsável, prioridade, prazo, checklist, arquivos,
// comentários, histórico, bloqueio), aberto a partir do Início, Kanban, Agenda e
// ficha do cliente via query param ?tarefa=ID (ver PainelDetalheTarefaHost). Busca
// tudo sozinho em GET /api/tarefas/[id] — nenhuma página precisou mudar a própria
// consulta pra abrir isso.
export function PainelDetalheTarefa({ tarefaId, onClose, amplo = false }: { tarefaId: string; onClose: () => void; amplo?: boolean }) {
  const router = useRouter();
  const [tarefa, setTarefa] = useState<TarefaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [responsavelId, setResponsavelId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [link, setLink] = useState("");
  const [estimativaHoras, setEstimativaHoras] = useState("");
  const [salvandoDetalhes, setSalvandoDetalhes] = useState(false);
  const [verificandoImpacto, setVerificandoImpacto] = useState(false);
  const [confirmandoImpacto, setConfirmandoImpacto] = useState<TarefaLigada[] | null>(null);

  // Dependências entre tarefas (Etapa 4 v158).
  const [candidatasDependencia, setCandidatasDependencia] = useState<TarefaLigada[]>([]);
  const [novaDependenciaId, setNovaDependenciaId] = useState("");
  const [salvandoDependencia, setSalvandoDependencia] = useState(false);

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
  const [mensagemVideoBruto, setMensagemVideoBruto] = useState("");
  const [gerandoPasta, setGerandoPasta] = useState(false);

  const [videoBrutoExcecao, setVideoBrutoExcecao] = useState(false);
  const [videoBrutoExcecaoMotivo, setVideoBrutoExcecaoMotivo] = useState("");
  const [salvandoExcecao, setSalvandoExcecao] = useState(false);

  async function carregar(sincronizarCampos = true) {
    if (sincronizarCampos) setCarregando(true);
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
      if (!sincronizarCampos) return;
      setTitulo(d.titulo);
      setDescricao(d.descricao || "");
      setCategoria(d.categoria || "");
      setPrioridade(d.prioridade || "media");
      setResponsavelId(d.responsavelId || "");
      const prazo = camposPrazo(d.prazo);
      setData(prazo.data);
      setHora(prazo.hora);
      setLink(d.link || "");
      setEstimativaHoras(d.estimativaHoras != null ? String(d.estimativaHoras) : "");
      setMotivoBloqueio(d.motivoBloqueio || "");
      setBloqueioResponsavelId(d.bloqueioResponsavelId || "");
      setVideoBrutoExcecao(d.videoBrutoExcecao || false);
      setVideoBrutoExcecaoMotivo(d.videoBrutoExcecaoMotivo || "");
      setStatusPendente(null);
    } catch { setErro("Não consegui abrir a tarefa. Confira a conexão e tente novamente."); }
    finally {
      setCarregando(false);
    }
  }

  // Candidatas a nova dependência (Etapa 4 v158) — função à parte pra poder
  // recarregar sozinha depois de criar/remover um vínculo, sem precisar refazer
  // o GET inteiro da tarefa junto.
  function carregarCandidatasDependencia() {
    fetch(`/api/tarefas/${tarefaId}/dependencias`)
      .then((r) => (r.ok ? r.json() : { candidatas: [] }))
      .then((d) => setCandidatasDependencia(d.candidatas || []))
      .catch(() => {});
  }

  useEffect(() => {
    carregar();
    carregarCandidatasDependencia();
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
    try {
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
    } catch { alert("Não consegui salvar. Seus campos foram mantidos; confira a conexão e tente novamente."); return null; }
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

  // "Mostrar impactos antes de alterar prazos" (Etapa 4 v158) — só verifica
  // quando o prazo realmente mudou E existe alguma tarefa que depende desta
  // (tarefa.bloqueiaDe): sem isso não tem impacto nenhum pra calcular, então nem
  // vale a pena gastar a chamada. NUNCA bloqueia — só pausa pra mostrar o aviso e
  // pede confirmação (ver lib/dependenciasTarefa.ts).
  async function salvarDetalhes() {
    if (!tarefa) return;
    const prazo = data ? `${data}T${hora || "00:00"}:00-03:00` : null;
    const prazoNovoDate = prazo ? new Date(prazo) : null;
    const prazoAntigoDate = tarefa.prazo ? new Date(tarefa.prazo) : null;
    const prazoMudou = (prazoNovoDate?.getTime() ?? null) !== (prazoAntigoDate?.getTime() ?? null);

    if (prazoNovoDate && prazoMudou && tarefa.bloqueiaDe.length > 0) {
      setVerificandoImpacto(true);
      const res = await fetch(`/api/tarefas/${tarefa.id}/impacto-prazo?novoPrazo=${encodeURIComponent(prazoNovoDate.toISOString())}`);
      const d = await res.json().catch(() => null);
      setVerificandoImpacto(false);
      if (d?.impactadas?.length > 0) {
        setConfirmandoImpacto(d.impactadas);
        return;
      }
    }
    await salvarDetalhesDeVerdade();
  }

  async function salvarDetalhesDeVerdade() {
    setSalvandoDetalhes(true);
    const prazo = data ? `${data}T${hora || "00:00"}:00-03:00` : null;
    const atualizado = await patch({
      titulo,
      categoria: categoria || null,
      descricao: descricao || null,
      prioridade: prioridade || null,
      responsavelId: responsavelId || null,
      prazo,
      link: link || null,
      estimativaHoras: estimativaHoras.trim() !== "" ? Number(estimativaHoras) : null,
    });
    setSalvandoDetalhes(false);
    setConfirmandoImpacto(null);
    if (atualizado) setTarefa((t) => (t ? { ...t, ...atualizado } : t));
  }

  // Depende de/bloqueia (Etapa 4 v158) — cada vínculo já salva na hora (mesmo
  // espírito de ChecklistTarefa: não faz parte do "Salvar alterações" em lote).
  async function adicionarDependencia() {
    if (!novaDependenciaId || !tarefa) return;
    setSalvandoDependencia(true);
    const res = await fetch(`/api/tarefas/${tarefa.id}/dependencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependeDeId: novaDependenciaId }),
    });
    setSalvandoDependencia(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui criar essa dependência.");
      return;
    }
    setNovaDependenciaId("");
    carregar();
    carregarCandidatasDependencia();
  }

  async function removerDependencia(vinculoId: string) {
    if (!window.confirm("Remover esse vínculo de dependência?")) return;
    const res = await fetch(`/api/dependencias/${vinculoId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui remover esse vínculo.");
      return;
    }
    carregar();
    carregarCandidatasDependencia();
  }

  async function verificarVideoBruto() {
    if (!tarefa?.driveFolderId) return;
    setChecandoVideo(true);
    setMensagemVideoBruto(""); setTemVideoBrutoInfo(null);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const res = await fetch(`/api/tarefas/${tarefa.id}/video-bruto`, { signal: controller.signal });
      const d = await res.json();
      if (!res.ok) throw new Error(d.erro || "Não consegui consultar o Drive.");
      setTemVideoBrutoInfo(d.temBruto);
      setMensagemVideoBruto(d.mensagem || "");
    } catch (e) { setMensagemVideoBruto(e instanceof Error && e.name !== "AbortError" ? e.message : "A consulta demorou demais. Confira a conexão do Drive e tente novamente."); }
    finally { clearTimeout(timer); setChecandoVideo(false); }
  }

  // Gera (ou substitui) a pasta própria da tarefa no Drive — sob demanda, pelo
  // botão. Principal uso: "destravar" uma tarefa que ainda aponta pra pasta
  // COMPARTILHADA da semana (jeito de antes da v153, não migrado automaticamente)
  // sem precisar mexer direto no banco. Não move nenhum arquivo da pasta antiga —
  // avisa disso antes, se já existia uma pasta vinculada.
  async function gerarPastaDrive() {
    if (tarefa?.driveFolderId) {
      const ok = window.confirm(
        "Isso cria uma pasta nova e vazia só pra esta tarefa. Nada é movido automaticamente — se já tinha arquivo na pasta antiga, mova pra pasta nova depois de gerá-la. Continuar?"
      );
      if (!ok) return;
    }
    setGerandoPasta(true);
    const res = await fetch(`/api/tarefas/${tarefaId}/pasta-drive`, { method: "POST" });
    const d = await res.json().catch(() => null);
    setGerandoPasta(false);
    if (!res.ok) {
      alert(d?.erro || "Não consegui gerar a pasta.");
      return;
    }
    setTemVideoBrutoInfo(null);
    setTarefa((t) => (t ? { ...t, driveFolderId: d.driveFolderId } : t));
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
    try {
    const res = await fetch(`/api/tarefas/${tarefa.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novoComentario.trim() }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      alert(d?.erro || "Não consegui enviar esse comentário.");
      return;
    }
    setNovoComentario("");
    await carregar(false);
    } catch { alert("Não consegui enviar o comentário. Seu texto foi mantido; tente novamente."); }
    finally { setEnviandoComentario(false); }
  }

  const urgenciaCor =
    tarefa?.prazo && tarefa.status !== "feito" && new Date(tarefa.prazo).getTime() < Date.now() ? "#EF4444" : undefined;

  return (
    <div className={`fixed inset-0 z-50 flex ${amplo ? "items-center justify-center p-2 sm:p-6" : "justify-end"}`}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Detalhes da tarefa" className={`relative flex w-full flex-col overflow-hidden bg-base shadow-premium-lg ${amplo ? "max-h-[92dvh] max-w-4xl rounded-2xl border border-border" : "h-full max-w-xl border-l border-border sm:w-[36rem]"}`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-text">Detalhes da tarefa</p>
          <button aria-label="Fechar detalhes da tarefa" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text">
            <X size={16} />
          </button>
        </div>

        {carregando && <div className="flex-1 p-6 text-sm text-muted">Carregando...</div>}
        {!carregando && erro && <div className="flex-1 p-6 text-sm text-red-400">{erro}</div>}

        {!carregando && tarefa && (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
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
            <label className="mb-1 block text-xs text-muted" htmlFor="categoria-detalhe">Categoria</label>
            <select id="categoria-detalhe" value={categoria} onChange={e => setCategoria(e.target.value)} className="mb-3 h-10 w-full rounded-lg border border-border bg-card/60 px-3 text-sm text-text">
              <option value="">Sem categoria</option>
              {CATEGORIAS_TAREFA.map(c => <option key={c.valor} value={c.valor}>{c.label}</option>)}
            </select>
            <label className="mb-1 mt-1 block text-xs text-muted">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              placeholder="Detalhes da tarefa..."
              className="mb-3 min-h-32 w-full resize-y rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
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
                  Horário (opcional)
                </label>
                <input
                  type="time"
                  aria-label="Horário opcional da tarefa"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
                />
              </div>
            </div>

            <label className="mb-1 block text-xs text-muted">Estimativa (horas)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimativaHoras}
              onChange={(e) => setEstimativaHoras(e.target.value)}
              placeholder="Ex.: 2"
              className="mb-3 h-9 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text outline-none focus:border-accent/50"
            />

            <label className="mb-1 block text-xs text-muted">Link / arquivo</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Cole um link (Drive, Canva, etc.)"
              className="mb-3 h-9 w-full rounded-lg border border-border bg-card/60 px-3 text-xs text-text outline-none focus:border-accent/50"
            />

            {CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO.includes((tarefa.categoria || "") as any) && (
              <div className="mb-3 rounded-lg border border-border bg-card/60 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text">
                  <HardDrive size={12} /> Pasta da tarefa no Drive
                </p>
                {tarefa.driveFolderId ? (
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
                        <CheckCircle2 size={12} /> Vídeo encontrado
                      </span>
                    )}
                    {temVideoBrutoInfo === false && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <AlertCircle size={12} /> Nenhum vídeo encontrado
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={gerarPastaDrive}
                      disabled={gerandoPasta}
                      className="text-[11px] text-muted underline decoration-dotted hover:text-text disabled:opacity-50"
                    >
                      {gerandoPasta ? "Gerando..." : "Gerar pasta nova"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">Esta tarefa ainda não tem pasta própria no Drive.</span>
                    <button
                      type="button"
                      onClick={gerarPastaDrive}
                      disabled={gerandoPasta}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-text hover:bg-hover disabled:opacity-50"
                    >
                      {gerandoPasta ? "Gerando..." : "Gerar pasta"}
                    </button>
                  </div>
                )}

                {mensagemVideoBruto && <div role="status" className="mt-2 text-xs text-muted"><p>{mensagemVideoBruto}</p>{temVideoBrutoInfo === null && <a href="/dashboard/configuracoes#google-drive" className="mt-1 inline-block text-accent">Conferir conexão do Drive</a>}</div>}
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

            {tarefa.clienteId && <div className="mb-3 rounded-lg border border-border bg-card/60 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text"><HardDrive size={12} /> Identidade do cliente</p>
              <p className="mb-2 text-xs text-muted">Logos claros, escuros, com e sem fundo e outros arquivos da marca. A mesma pasta em todas as tarefas deste cliente.</p>
              {tarefa.cliente?.driveLogotiposFolderId && <a href={`https://drive.google.com/drive/folders/${tarefa.cliente.driveLogotiposFolderId}`} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text hover:bg-hover"><ExternalLink size={11} /> Abrir pasta da identidade</a>}
              <a href={`/dashboard/clientes/${tarefa.clienteId}?aba=links`} className="inline-flex py-1.5 text-xs text-accent">{tarefa.cliente?.driveLogotiposFolderId ? "Configurar pasta no cliente" : "Cadastrar ou criar pasta no cliente"}</a>
            </div>}

            {/* Impacto no prazo (Etapa 4 v158) — "mostrar impactos antes de
                alterar prazos". Nunca impede: só avisa e pede confirmação. */}
            {confirmandoImpacto && (
              <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-400">
                  <AlertCircle size={12} /> Mudar esse prazo deixa {confirmandoImpacto.length === 1 ? "esta tarefa apertada" : "estas tarefas apertadas"}:
                </p>
                <ul className="mb-2 flex flex-col gap-0.5">
                  {confirmandoImpacto.map((t) => (
                    <li key={t.id} className="text-[11px] text-muted">
                      • {t.titulo}
                      {t.prazo ? ` — prazo em ${new Date(t.prazo).toLocaleDateString("pt-BR")}` : ""}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={salvarDetalhesDeVerdade}
                    disabled={salvandoDetalhes}
                    className="h-8 flex-1 rounded-lg bg-amber-500 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {salvandoDetalhes ? "Salvando..." : "Salvar assim mesmo"}
                  </button>
                  <button
                    onClick={() => setConfirmandoImpacto(null)}
                    className="h-8 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={salvarDetalhes}
              disabled={salvandoDetalhes || verificandoImpacto}
              className="mb-4 h-9 w-full rounded-lg bg-accent text-xs font-medium text-white disabled:opacity-50"
            >
              {verificandoImpacto ? "Verificando impacto no prazo..." : salvandoDetalhes ? "Salvando..." : "Salvar alterações"}
            </button>

            {/* Checklist */}
            <div className="mb-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-text">Sub-passos</p>
              <ChecklistTarefa tarefaId={tarefa.id} itens={tarefa.checklist} />
            </div>

            {/* Dependências entre tarefas (Etapa 4 v158) — cada vínculo salva na
                hora (não entra no "Salvar alterações" em lote). "Bloqueia" é só
                leitura + remover; criar um vínculo novo sempre parte do lado
                "depende de" (decisão reversível — evita duplicar o mesmo
                formulário dos dois lados). */}
            <div className="mb-4 border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text">
                <GitBranch size={12} /> Dependências
              </p>

              {tarefa.rotinaGerada && (
                <p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted">
                  <Repeat size={11} /> Gerada automaticamente ({NOMES_MESES[tarefa.rotinaGerada.mes]}/{tarefa.rotinaGerada.ano})
                </p>
              )}

              <p className="mb-1 text-[11px] font-medium text-muted">Esta tarefa depende de</p>
              {tarefa.dependeDe.length === 0 && <p className="mb-2 text-xs text-muted">Nenhuma.</p>}
              {tarefa.dependeDe.length > 0 && (
                <div className="mb-2 flex flex-col gap-1">
                  {tarefa.dependeDe.map((v) => (
                    <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg bg-card/60 px-2.5 py-1.5 text-xs">
                      <span className={v.dependeDe.status === "feito" ? "text-muted line-through" : "text-text"}>
                        {v.dependeDe.titulo}
                      </span>
                      <button onClick={() => removerDependencia(v.id)} className="shrink-0 text-muted hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-3 flex items-center gap-1.5">
                <select
                  value={novaDependenciaId}
                  onChange={(e) => setNovaDependenciaId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
                >
                  <option value="">Adicionar dependência...</option>
                  {candidatasDependencia.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={adicionarDependencia}
                  disabled={!novaDependenciaId || salvandoDependencia}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40"
                >
                  <Plus size={13} />
                </button>
              </div>

              {tarefa.bloqueiaDe.length > 0 && (
                <>
                  <p className="mb-1 text-[11px] font-medium text-muted">Tarefas que dependem desta</p>
                  <div className="flex flex-col gap-1">
                    {tarefa.bloqueiaDe.map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg bg-card/60 px-2.5 py-1.5 text-xs text-text">
                        <span>{v.tarefa.titulo}</span>
                        <button onClick={() => removerDependencia(v.id)} className="shrink-0 text-muted hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
              <form onSubmit={enviarComentario} className="flex items-end gap-2">
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escrever um comentário..."
                  aria-label="Comentário interno da tarefa"
                  rows={4}
                  disabled={enviandoComentario}
                  className="min-h-24 w-full flex-1 resize-y rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
                />
                <button
                  type="submit"
                  aria-label="Enviar comentário interno"
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
