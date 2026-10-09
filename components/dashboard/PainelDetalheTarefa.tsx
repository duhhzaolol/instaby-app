"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
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
  ArrowRight,
  Lightbulb,
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
import { diaTrabalho, tarefaAtrasada } from "@/lib/organizacaoTarefas";

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
  tipo: string;
  dadosComplementaresPendentes?: boolean;
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

function camposDataTarefa(valor: string | null) {
  if (!valor) return { data: "", hora: "" };
  const data = diaTrabalho(valor);
  const instante = new Date(valor);
  const semHorario = /^\d{4}-\d{2}-\d{2}$/.test(valor) ||
    (Number.isFinite(instante.getTime()) && instante.toISOString().endsWith("T00:00:00.000Z"));
  return { data, hora: semHorario ? "" : camposPrazo(valor).hora };
}

function dataTarefaParaSalvar(original: string | null, data: string, hora: string) {
  const camposOriginais = camposDataTarefa(original);
  // Meia-noite é o padrão de uma data sem horário, como no restante da Agenda.
  const horario = hora === "00:00" ? "" : hora;
  if (data === camposOriginais.data && horario === camposOriginais.hora) return original;
  return data ? `${data}T${horario || "00:00"}:00-03:00` : null;
}

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
  const [erroPessoas, setErroPessoas] = useState<string | null>(null);
  const [aba, setAba] = useState<"conteudo" | "revisao">("conteudo");
  const [complementoCarregando, setComplementoCarregando] = useState(false);
  const [erroComplemento, setErroComplemento] = useState<string | null>(null);
  const [mudandoTipo, setMudandoTipo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const montado = useRef(true);
  const consulta = useRef(0);
  const consultaAbort = useRef<AbortController | null>(null);
  const complementoCarregado = useRef(false);
  const complementoEmCurso = useRef<Promise<TarefaDetalhe | null> | null>(null);
  const consultaPessoas = useRef(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [responsavelId, setResponsavelId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [dataPostagem, setDataPostagem] = useState("");
  const [horaPostagem, setHoraPostagem] = useState("");
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

  async function carregar(sincronizarCampos = true, completo = complementoCarregado.current): Promise<TarefaDetalhe | null> {
    const sequencia = ++consulta.current;
    consultaAbort.current?.abort();
    const controller = new AbortController();
    consultaAbort.current = controller;
    if (sincronizarCampos) setCarregando(true);
    if (sincronizarCampos) setErro(null);
    try {
      const res = await fetch(`/api/tarefas/${tarefaId}${completo ? "" : "?resumo=1"}`, { cache: "no-store", signal: controller.signal });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.erro || "Não consegui abrir essa tarefa.");
      }
      const d: TarefaDetalhe = await res.json();
      if (!montado.current || sequencia !== consulta.current) return null;
      if (completo || !d.dadosComplementaresPendentes) complementoCarregado.current = true;
      setTarefa(d);
      if (!sincronizarCampos) return d;
      setTitulo(d.titulo);
      setDescricao(d.descricao || "");
      setCategoria(d.categoria || "");
      setPrioridade(d.prioridade || "media");
      setResponsavelId(d.responsavelId || "");
      const prazo = camposDataTarefa(d.prazo);
      setData(prazo.data);
      setHora(prazo.hora);
      const postagem = camposDataTarefa(d.publicacaoSugeridaEm);
      setDataPostagem(postagem.data);
      setHoraPostagem(postagem.hora);
      setLink(d.link || "");
      setEstimativaHoras(d.estimativaHoras != null ? String(d.estimativaHoras) : "");
      setMotivoBloqueio(d.motivoBloqueio || "");
      setBloqueioResponsavelId(d.bloqueioResponsavelId || "");
      setVideoBrutoExcecao(d.videoBrutoExcecao || false);
      setVideoBrutoExcecaoMotivo(d.videoBrutoExcecaoMotivo || "");
      setStatusPendente(null);
      return d;
    } catch (e) {
      if (!montado.current || controller.signal.aborted) return null;
      const mensagem = e instanceof Error ? e.message : "Não consegui abrir a tarefa. Confira a conexão e tente novamente.";
      if (sincronizarCampos) setErro(mensagem);
      else setErroComplemento(mensagem);
      return null;
    }
    finally {
      if (montado.current && sequencia === consulta.current) setCarregando(false);
    }
  }

  async function garantirComplementos(): Promise<TarefaDetalhe | null> {
    if (complementoCarregado.current) return tarefa;
    if (complementoEmCurso.current) return complementoEmCurso.current;
    setComplementoCarregando(true);
    setErroComplemento(null);
    const operacao = carregar(false, true);
    complementoEmCurso.current = operacao;
    try { return await operacao; }
    finally {
      complementoEmCurso.current = null;
      if (montado.current) setComplementoCarregando(false);
    }
  }

  async function carregarPessoas() {
    if (consultaPessoas.current) return;
    consultaPessoas.current = true;
    setErroPessoas(null);
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("Não consegui carregar os responsáveis. Tente selecionar novamente.");
      const d = await res.json();
      if (montado.current) setPessoas(d);
    } catch (e) {
      consultaPessoas.current = false;
      if (montado.current) setErroPessoas(e instanceof Error ? e.message : "Não consegui carregar os responsáveis.");
    }
  }

  // Candidatas a nova dependência (Etapa 4 v158) — função à parte pra poder
  // recarregar sozinha depois de criar/remover um vínculo, sem precisar refazer
  // o GET inteiro da tarefa junto.
  function carregarCandidatasDependencia() {
    fetch(`/api/tarefas/${tarefaId}/dependencias`)
      .then((r) => (r.ok ? r.json() : { candidatas: [] }))
      .then((d) => { if (montado.current) setCandidatasDependencia(d.candidatas || []); })
      .catch(() => {});
  }

  useEffect(() => {
    montado.current = true;
    carregar();
    return () => {
      montado.current = false;
      consulta.current++;
      consultaAbort.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tarefaId]);

  useEffect(() => {
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painelRef.current?.focus();
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
      if (e.key !== "Tab") return;
      const itens = Array.from(painelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (!primeiro) { e.preventDefault(); painelRef.current?.focus(); }
      else if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === painelRef.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (document.activeElement === ultimo || document.activeElement === painelRef.current)) { e.preventDefault(); primeiro.focus(); }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
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
      if (montado.current) setErro(d?.erro || "Não consegui salvar essa alteração.");
      return null;
    }
    const atualizado = await res.json();
    if (!montado.current) return null;
    router.refresh();
    setErro(null);
    return atualizado;
    } catch { if (montado.current) setErro("Não consegui salvar. Seus campos foram mantidos; confira a conexão e tente novamente."); return null; }
  }

  async function clicarStatus(novo: string) {
    if (!tarefa) return;
    if (novo === tarefa.status) return;
    if (novo === "feito" || novo === "bloqueada") {
      const atual = novo === "feito" ? await garantirComplementos() : tarefa;
      if (!atual || !montado.current) return;
      if (novo === "bloqueada") carregarPessoas();
      setStatusPendente(novo);
      if (novo === "feito") {
        setHoraInicioConclusao(atual.registroTempoAberto ? horaDe(atual.registroTempoAberto.inicio) : horaAtual());
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
    const prazo = dataTarefaParaSalvar(tarefa.prazo, data, hora);
    const prazoNovoDate = prazo ? new Date(prazo) : null;
    const prazoAntigoDate = tarefa.prazo ? new Date(tarefa.prazo) : null;
    const prazoMudou = (prazoNovoDate?.getTime() ?? null) !== (prazoAntigoDate?.getTime() ?? null);

    const atual = prazoNovoDate && prazoMudou ? await garantirComplementos() : tarefa;
    if (prazoNovoDate && prazoMudou && !atual) return;
    if (prazoNovoDate && prazoMudou && atual && atual.bloqueiaDe.length > 0) {
      setVerificandoImpacto(true);
      let d;
      try {
        const res = await fetch(`/api/tarefas/${tarefa.id}/impacto-prazo?novoPrazo=${encodeURIComponent(prazoNovoDate.toISOString())}`);
        if (!res.ok) throw new Error();
        d = await res.json();
      } catch { setErro("Não consegui verificar os prazos ligados. Tente salvar novamente."); return; }
      finally { setVerificandoImpacto(false); }
      if (d?.impactadas?.length > 0) {
        setConfirmandoImpacto(d.impactadas);
        return;
      }
    }
    await salvarDetalhesDeVerdade();
  }

  async function salvarDetalhesDeVerdade() {
    if (!tarefa) return;
    setSalvandoDetalhes(true);
    const prazo = dataTarefaParaSalvar(tarefa.prazo, data, hora);
    const atualizado = await patch({
      titulo,
      categoria: categoria || null,
      descricao: descricao || null,
      prioridade: prioridade || null,
      responsavelId: responsavelId || null,
      prazo,
      publicacaoSugeridaEm: dataTarefaParaSalvar(tarefa.publicacaoSugeridaEm, dataPostagem, horaPostagem),
      link: link || null,
      estimativaHoras: estimativaHoras.trim() !== "" ? Number(estimativaHoras) : null,
    });
    setSalvandoDetalhes(false);
    setConfirmandoImpacto(null);
    if (atualizado) setTarefa((t) => (t ? { ...t, ...atualizado } : t));
    if (atualizado) setAviso("Alterações salvas.");
  }

  async function mudarOrganizacao(tipo: "ideia" | "tarefa") {
    if (!tarefa || mudandoTipo) return;
    setMudandoTipo(true);
    const atualizado = await patch({
      tipo,
      titulo,
      descricao: descricao || null,
      categoria: categoria || null,
      prioridade: prioridade || null,
      responsavelId: responsavelId || null,
      prazo: dataTarefaParaSalvar(tarefa.prazo, data, hora),
      publicacaoSugeridaEm: dataTarefaParaSalvar(tarefa.publicacaoSugeridaEm, dataPostagem, horaPostagem),
      link: link || null,
      estimativaHoras: estimativaHoras.trim() !== "" ? Number(estimativaHoras) : null,
    });
    if (!montado.current) return;
    setMudandoTipo(false);
    if (atualizado) {
      setTarefa(t => t ? { ...t, ...atualizado } : t);
      setAviso(tipo === "ideia" ? "Movido para Planejamento. As informações foram mantidas." : "Conteúdo colocado em Produção.");
    }
  }

  // Depende de/bloqueia (Etapa 4 v158) — cada vínculo já salva na hora (mesmo
  // espírito de ChecklistTarefa: não faz parte do "Salvar alterações" em lote).
  async function adicionarDependencia() {
    if (!novaDependenciaId || !tarefa) return;
    setSalvandoDependencia(true);
    try {
    const res = await fetch(`/api/tarefas/${tarefa.id}/dependencias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependeDeId: novaDependenciaId }),
    });
    if (!montado.current) return;
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErro(d?.erro || "Não consegui criar essa dependência.");
      return;
    }
    setNovaDependenciaId("");
    carregar(false, true);
    carregarCandidatasDependencia();
    } catch { if (montado.current) setErro("Não consegui criar a dependência. Tente novamente."); }
    finally { if (montado.current) setSalvandoDependencia(false); }
  }

  async function removerDependencia(vinculoId: string) {
    if (!window.confirm("Remover esse vínculo de dependência?")) return;
    try {
    const res = await fetch(`/api/dependencias/${vinculoId}`, { method: "DELETE" });
    if (!montado.current) return;
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      setErro(d?.erro || "Não consegui remover esse vínculo.");
      return;
    }
    carregar(false, true);
    carregarCandidatasDependencia();
    } catch { if (montado.current) setErro("Não consegui remover a dependência. Tente novamente."); }
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
    try {
    const res = await fetch(`/api/tarefas/${tarefaId}/pasta-drive`, { method: "POST" });
    const d = await res.json().catch(() => null);
    if (!montado.current) return;
    if (!res.ok) {
      setErro(d?.erro || "Não consegui gerar a pasta.");
      return;
    }
    setTemVideoBrutoInfo(null);
    setTarefa((t) => (t ? { ...t, driveFolderId: d.driveFolderId } : t));
    } catch { if (montado.current) setErro("Não consegui gerar a pasta. Confira a conexão e tente novamente."); }
    finally { if (montado.current) setGerandoPasta(false); }
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
    tarefa && tarefaAtrasada(tarefa) ? "#EF4444" : undefined;


  const planejamento = tarefa?.tipo === "ideia";
  const temRevisao = CATEGORIAS_COM_REVISAO.includes((tarefa?.categoria || "") as any);
  const campoClass = "min-h-11 w-full rounded-lg border border-border bg-card/60 px-3 text-base text-text outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 placeholder:text-muted sm:text-sm";

  return (
    <div className={`fixed inset-0 z-50 flex ${amplo ? "items-center justify-center p-2 sm:p-6" : "justify-end"}`}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div ref={painelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="titulo-painel-tarefa" className={`relative flex w-full flex-col overflow-hidden bg-base shadow-premium-lg outline-none ${amplo ? "h-[94dvh] max-w-5xl rounded-2xl border border-border" : "h-full max-w-3xl border-l border-border"}`}>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-6">
          <p id="titulo-painel-tarefa" className="text-sm font-medium text-text">{planejamento ? "Planejamento de conteúdo" : "Detalhes da produção"}</p>
          <button aria-label="Fechar detalhes da tarefa" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            <X size={20} />
          </button>
        </div>

        {carregando && <div aria-busy="true" role="status" className="flex-1 space-y-5 p-6"><p className="text-sm text-muted">Abrindo conteúdo…</p><div className="h-8 w-3/4 rounded-lg bg-card" /><div className="h-48 rounded-xl bg-card" /><div className="grid grid-cols-2 gap-4"><div className="h-20 rounded-lg bg-card" /><div className="h-20 rounded-lg bg-card" /></div></div>}
        {!carregando && !tarefa && <div className="flex-1 p-6"><p role="alert" className="mb-4 text-sm text-red-400">{erro || "Não consegui abrir essa tarefa."}</p><button onClick={() => carregar()} className="min-h-11 rounded-lg border border-border px-4 text-sm text-text hover:bg-hover">Tentar novamente</button></div>}

        {!carregando && tarefa && <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
              {tarefa.cliente && <span className="inline-flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tarefa.cliente.cor || "#9CA3AF" }} />{tarefa.cliente.nome}</span>}
              <span className="inline-flex items-center gap-1.5 rounded-md bg-card px-2 py-1 text-xs text-text">{planejamento && <Lightbulb size={14} />}{planejamento ? "Planejamento" : "Produção"}</span>
              <span className="text-xs">{visualDaCategoriaTarefa(tarefa.categoria).label}</span>
            </div>
            <label htmlFor="titulo-detalhe" className="sr-only">Título do conteúdo ou tarefa</label>
            <textarea id="titulo-detalhe" rows={2} value={titulo} onChange={e => setTitulo(e.target.value)} className="mb-5 h-[4.5rem] w-full min-w-0 resize-none rounded-lg border border-transparent bg-transparent px-1 py-1 text-xl font-semibold leading-8 text-text outline-none focus:border-border focus:bg-card/60 sm:h-12 sm:text-2xl sm:leading-9" />

            {temRevisao && <div className="mb-5 flex gap-1 border-b border-border" role="tablist" aria-label="Áreas do conteúdo">
              <button role="tab" id="aba-resumo-tarefa" aria-controls="resumo-tarefa" aria-selected={aba === "conteudo"} onClick={() => setAba("conteudo")} className={`min-h-11 border-b-2 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${aba === "conteudo" ? "border-accent text-text" : "border-transparent text-muted hover:text-text"}`}>Resumo e comentários</button>
              <button role="tab" id="aba-revisao-tarefa" aria-controls="revisao-tarefa" aria-selected={aba === "revisao"} onClick={() => { setAba("revisao"); if (!planejamento) garantirComplementos(); }} className={`min-h-11 border-b-2 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${aba === "revisao" ? "border-accent text-text" : "border-transparent text-muted hover:text-text"}`}>Revisão do cliente</button>
            </div>}
            {erro && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 p-3 text-sm text-red-400">{erro}</p>}
            {aviso && <p role="status" className="mb-4 text-sm text-emerald-400">{aviso}</p>}
            {erroComplemento && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-red-400"><p>{erroComplemento}</p><button onClick={() => garantirComplementos()} className="min-h-11 rounded-lg border border-border px-3 text-text">Tentar novamente</button></div>}
            {complementoCarregando && <p role="status" className="mb-4 text-sm text-muted">Carregando os detalhes desta seção…</p>}

            <div id="resumo-tarefa" role={temRevisao ? "tabpanel" : undefined} aria-labelledby={temRevisao ? "aba-resumo-tarefa" : undefined} hidden={aba !== "conteudo"}>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(15rem,1fr)]">
                <div className="min-w-0">
                  <label htmlFor="descricao-detalhe" className="mb-2 block text-sm font-medium text-text">Roteiro e descrição</label>
                  <textarea id="descricao-detalhe" value={descricao} onChange={e => setDescricao(e.target.value)} rows={9} placeholder="Anote a ideia, o roteiro e o que precisa ser feito…" className={`${campoClass} min-h-56 resize-y py-3 leading-relaxed`} />
                  <details className="mt-4 border-b border-border pb-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-text">Sub-passos{tarefa.checklist.length > 0 ? ` (${tarefa.checklist.length})` : ""}</summary><div className="pt-2"><ChecklistTarefa tarefaId={tarefa.id} itens={tarefa.checklist} onChange={async () => { await carregar(false); }} /></div></details>
                </div>
                <div className="min-w-0 space-y-4">
                  <div><label className="mb-2 block text-sm font-medium text-text">Dia planejado de postagem</label><DatePicker className="[&>button]:min-h-11" value={dataPostagem} onChange={setDataPostagem} placeholder="Escolher o dia" limpavel /><p className="mt-1.5 text-xs leading-relaxed text-muted">Aparece na Agenda em Postagens. O horário é opcional.</p></div>
                  <div><label className="mb-2 block text-sm font-medium text-text" style={urgenciaCor ? { color: urgenciaCor } : undefined}>Prazo de produção</label><DatePicker className="[&>button]:min-h-11" value={data} onChange={setData} placeholder="Quando precisa estar pronto?" limpavel /><p className="mt-1.5 text-xs leading-relaxed text-muted">Quando o trabalho precisa estar pronto, antes da postagem.</p></div>
                  <div><label htmlFor="responsavel-detalhe" className="mb-2 block text-sm font-medium text-text">Responsável</label><select id="responsavel-detalhe" value={responsavelId} onFocus={carregarPessoas} onChange={e => setResponsavelId(e.target.value)} className={campoClass}><option value="">Sem responsável</option>{tarefa.responsavel && !pessoas.some(p => p.id === tarefa.responsavel?.id) && <option value={tarefa.responsavel.id}>{tarefa.responsavel.nome}</option>}{pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>{erroPessoas && <p role="alert" className="mt-2 text-xs text-red-400">{erroPessoas}</p>}</div>
                  <div className="border-t border-border pt-4"><p className="mb-2 text-sm font-medium text-text">Próxima ação</p>{planejamento ? <><p className="mb-3 text-xs leading-relaxed text-muted">Esta ideia fica no cronograma e fora da fila de produção até você decidir trabalhar nela.</p><button onClick={() => mudarOrganizacao("tarefa")} disabled={mudandoTipo || salvandoDetalhes} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{mudandoTipo ? "Salvando…" : "Colocar em produção"}<ArrowRight size={16} /></button></> : <><div className="flex flex-wrap gap-2">{STATUS_ORDEM.map(s => <button key={s} onClick={() => clicarStatus(s)} aria-pressed={tarefa.status === s} className={`min-h-11 rounded-lg border px-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${tarefa.status === s ? "border-accent/40 bg-accent/10 text-text" : "border-border text-muted hover:bg-hover hover:text-text"}`}>{s === "a_fazer" ? "A produzir" : s === "em_andamento" ? "Em produção" : STATUS_LABEL[s]}</button>)}</div>{tarefa.status === "a_fazer" && <button onClick={() => mudarOrganizacao("ideia")} disabled={mudandoTipo || salvandoDetalhes} className="mt-2 min-h-11 text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-text disabled:opacity-50">{mudandoTipo ? "Movendo…" : "Mover para planejamento"}</button>}</>}</div>
                </div>
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
                  onFocus={carregarPessoas}
                  value={bloqueioResponsavelId}
                  onChange={(e) => setBloqueioResponsavelId(e.target.value)}
                  className="mb-2 min-h-11 w-full rounded-lg border border-border bg-base px-2 text-xs text-text"
                >
                  <option value="">Ainda não sei</option>
                  {tarefa.bloqueioResponsavel && !pessoas.some(p => p.id === tarefa.bloqueioResponsavel?.id) && <option value={tarefa.bloqueioResponsavel.id}>{tarefa.bloqueioResponsavel.nome}</option>}
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
                    className="min-h-11 flex-1 rounded-lg bg-red-500 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {salvandoBloqueio ? "Salvando..." : tarefa.status === "bloqueada" ? "Salvar bloqueio" : "Confirmar bloqueio"}
                  </button>
                  {tarefa.status === "bloqueada" && (
                    <button
                      onClick={desbloquear}
                      className="flex min-h-11 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
                    >
                      <Unlock size={11} /> Desbloquear
                    </button>
                  )}
                  {statusPendente === "bloqueada" && tarefa.status !== "bloqueada" && (
                    <button
                      onClick={() => setStatusPendente(null)}
                      className="min-h-11 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
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


              {statusPendente === "feito" && <div className="my-4 rounded-xl border border-border p-4"><p className="mb-3 text-sm font-medium text-text">Concluir esta produção?</p>{tarefa.registroTempoAberto ? <p className="mb-3 text-sm text-muted">O registro de horas em andamento será encerrado.</p> : <details className="mb-3"><summary className="min-h-11 cursor-pointer py-3 text-sm text-muted">Registrar horas trabalhadas (opcional)</summary><div className="mb-3 grid grid-cols-2 gap-3"><div><label htmlFor="horas-inicio-detalhe" className="mb-1 block text-xs text-muted">Início</label><input id="horas-inicio-detalhe" type="time" value={horaInicioConclusao} onChange={e => setHoraInicioConclusao(e.target.value)} className={campoClass} /></div><div><label htmlFor="horas-fim-detalhe" className="mb-1 block text-xs text-muted">Fim</label><input id="horas-fim-detalhe" type="time" value={horaFimConclusao} onChange={e => setHoraFimConclusao(e.target.value)} className={campoClass} /></div></div><button onClick={() => confirmarConclusao(true)} disabled={salvandoConclusao} className="min-h-11 rounded-lg border border-border px-3 text-sm text-text disabled:opacity-50">Concluir e registrar horas</button></details>}<div className="flex flex-wrap gap-3"><button onClick={() => confirmarConclusao(false)} disabled={salvandoConclusao} className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50">{salvandoConclusao ? "Concluindo…" : "Concluir produção"}</button><button onClick={() => setStatusPendente(null)} disabled={salvandoConclusao} className="min-h-11 rounded-lg border border-border px-4 text-sm text-text">Cancelar</button></div></div>}
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
                    className="min-h-11 flex-1 rounded-lg bg-amber-500 text-xs font-medium text-white disabled:opacity-40"
                  >
                    {salvandoDetalhes ? "Salvando..." : "Salvar assim mesmo"}
                  </button>
                  <button
                    onClick={() => setConfirmandoImpacto(null)}
                    className="min-h-11 rounded-lg border border-border px-2.5 text-xs text-muted hover:text-text"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}



            {/* Comentários internos */}
            <div className="mt-8 border-t border-border pt-5">
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
                  className="min-h-24 w-full flex-1 resize-y rounded-lg border border-border bg-card/60 px-3 py-2 text-base text-text outline-none focus:border-accent/50 sm:text-sm"
                />
                <button
                  type="submit"
                  aria-label="Enviar comentário interno"
                  disabled={enviandoComentario || !novoComentario.trim()}
                  className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>


              <div className="mt-7 border-t border-border">
                <details onToggle={e => { if (e.currentTarget.open) carregarPessoas(); }} className="border-b border-border py-1"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-text">Configurações de produção</summary><div className="grid gap-4 pb-4 sm:grid-cols-2"><div><label htmlFor="categoria-detalhe" className="mb-2 block text-xs text-muted">Categoria</label><select id="categoria-detalhe" value={categoria} onChange={e => setCategoria(e.target.value)} className={campoClass}><option value="">Sem categoria</option>{CATEGORIAS_TAREFA.map(c => <option key={c.valor} value={c.valor}>{c.label}</option>)}</select></div><div><label htmlFor="prioridade-detalhe" className="mb-2 block text-xs text-muted">Prioridade</label><select id="prioridade-detalhe" value={prioridade} onChange={e => setPrioridade(e.target.value)} className={campoClass}><option value="">Sem prioridade</option>{PRIORIDADES.map(p => <option key={p.valor} value={p.valor}>{p.label}</option>)}</select></div><div><label htmlFor="estimativa-detalhe" className="mb-2 block text-xs text-muted">Estimativa de horas</label><input id="estimativa-detalhe" type="number" min="0" step="0.5" value={estimativaHoras} onChange={e => setEstimativaHoras(e.target.value)} placeholder="Ex.: 2" className={campoClass} /></div><div><label htmlFor="hora-prazo-detalhe" className="mb-2 block text-xs text-muted">Horário do prazo (opcional)</label><input id="hora-prazo-detalhe" type="time" value={hora} onChange={e => setHora(e.target.value)} disabled={!data} className={campoClass} /></div><div><label htmlFor="hora-postagem-detalhe" className="mb-2 block text-xs text-muted">Horário da postagem (opcional)</label><input id="hora-postagem-detalhe" type="time" value={horaPostagem} onChange={e => setHoraPostagem(e.target.value)} disabled={!dataPostagem} className={campoClass} /></div></div></details>
                <details onToggle={e => { if (e.currentTarget.open) garantirComplementos(); }} className="border-b border-border py-1"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-text">Arquivos, Drive e identidade do cliente</summary><div className="pb-3"><label htmlFor="link-detalhe" className="mb-2 block text-xs text-muted">Link ou arquivo</label><input id="link-detalhe" value={link} onChange={e => setLink(e.target.value)} placeholder="Link do Drive, Canva ou outro arquivo" className={`${campoClass} mb-4`} />
            {CATEGORIAS_QUE_PRECISAM_VIDEO_BRUTO.includes((tarefa.categoria || "") as any) && (
              <div className="mb-3 rounded-lg border border-border bg-card/60 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text">
                  <HardDrive size={12} /> Pasta da tarefa no Drive
                </p>
                {tarefa.driveFolderId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://drive.google.com/drive/folders/${tarefa.driveFolderId}`}
                      target="_blank" rel="noreferrer"
                      className="flex min-h-11 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text hover:bg-hover"
                    >
                      <ExternalLink size={11} /> Abrir pasta
                    </a>
                    <button
                      type="button"
                      onClick={verificarVideoBruto}
                      disabled={checandoVideo}
                      className="min-h-11 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:text-text disabled:opacity-50"
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
                      className="min-h-11 text-xs text-muted underline decoration-dotted hover:text-text disabled:opacity-50"
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
                      className="min-h-11 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text hover:bg-hover disabled:opacity-50"
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
                    className="mt-1.5 min-h-11 rounded-lg border border-border px-2.5 text-xs text-text hover:bg-hover disabled:opacity-50"
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
              {tarefa.cliente?.driveLogotiposFolderId && <a href={`https://drive.google.com/drive/folders/${tarefa.cliente.driveLogotiposFolderId}`} target="_blank" rel="noreferrer" className="mr-3 inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text hover:bg-hover"><ExternalLink size={11} /> Abrir pasta da identidade</a>}
              <a href={`/dashboard/clientes/${tarefa.clienteId}?aba=links`} className="inline-flex min-h-11 items-center py-1.5 text-xs text-accent">{tarefa.cliente?.driveLogotiposFolderId ? "Configurar pasta no cliente" : "Cadastrar ou criar pasta no cliente"}</a>
            </div>}


                </div></details>
                <details onToggle={e => { if (e.currentTarget.open) { garantirComplementos(); carregarCandidatasDependencia(); } }} className="border-b border-border py-1"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-text">Dependências e rotina</summary>{!tarefa.dadosComplementaresPendentes && <>
            {/* Dependências entre tarefas (Etapa 4 v158) — cada vínculo salva na
                hora (não entra no "Salvar alterações" em lote). "Bloqueia" é só
                leitura + remover; criar um vínculo novo sempre parte do lado
                "depende de" (decisão reversível — evita duplicar o mesmo
                formulário dos dois lados). */}
            <div className="mt-3">
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
                      <button onClick={() => removerDependencia(v.id)} aria-label="Remover dependência" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-red-400">
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
                  className="min-h-11 w-full rounded-lg border border-border bg-card/60 px-2 text-xs text-text"
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
                  aria-label="Adicionar dependência"
                  disabled={!novaDependenciaId || salvandoDependencia}
                  className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40"
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
                        <button onClick={() => removerDependencia(v.id)} aria-label="Remover dependência" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>


                </>}</details>
                <div className="py-4">
            {/* Histórico */}
            <div className="border-t border-border pt-3">
              <button
                onClick={() => { if (!historicoAberto) garantirComplementos(); setHistoricoAberto(v => !v); }}
                className="mb-2 flex w-full items-center justify-between text-xs font-medium text-text"
              >
                <span className="flex items-center gap-1.5">
                  <HistoryIcon size={12} /> Histórico de alterações{complementoCarregado.current ? ` (${tarefa.historico.length})` : ""}
                </span>
                <ChevronDown size={13} className={`text-muted transition-transform ${historicoAberto ? "rotate-180" : ""}`} />
              </button>
              {historicoAberto && !complementoCarregando && !tarefa.dadosComplementaresPendentes && (
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
              </div>
            </div>
            {temRevisao && <div id="revisao-tarefa" role="tabpanel" aria-labelledby="aba-revisao-tarefa" hidden={aba !== "revisao"}>{planejamento ? <div className="max-w-xl py-4"><h2 className="mb-2 text-lg font-medium text-text">Da ideia para a produção</h2><p className="mb-5 text-sm leading-relaxed text-muted">Coloque este conteúdo em produção antes de enviar uma versão para revisão do cliente. O mesmo conteúdo segue com seu roteiro, datas e arquivos.</p><button onClick={() => mudarOrganizacao("tarefa")} disabled={mudandoTipo || salvandoDetalhes} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{mudandoTipo ? "Salvando…" : "Colocar em produção"}<ArrowRight size={16} /></button></div> : !tarefa.dadosComplementaresPendentes && <PainelRevisaoConteudo tarefa={tarefa} patch={patch} recarregar={async () => { await carregar(false, true); }} />}</div>}
          </div>
          {aba === "conteudo" && <div className="flex shrink-0 items-center justify-end gap-4 border-t border-border px-4 py-3 sm:px-6">{(erro || aviso) && <p className={`mr-auto hidden text-xs sm:block ${erro ? "text-red-400" : "text-muted"}`}>{erro || aviso}</p>}<button onClick={salvarDetalhes} disabled={salvandoDetalhes || verificandoImpacto || mudandoTipo} className="min-h-11 w-full rounded-lg bg-accent px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:w-auto">{verificandoImpacto ? "Verificando os prazos…" : salvandoDetalhes ? "Salvando…" : "Salvar alterações"}</button></div>}
        </>}
      </div>
    </div>
  );
}
